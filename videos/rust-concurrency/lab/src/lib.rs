//! Verified Rust concurrency experiments accompanying *Rust Concurrency: Ownership Across Time*.
//!
//! Compile-fail doc tests prove what `rustc` rejects before a binary exists.
//!
//! # 1. Non-`Send` handle (`Rc`) cannot cross `thread::spawn`
//!
//! ```compile_fail,E0277
//! use std::rc::Rc;
//! use std::thread;
//!
//! let shared = Rc::new(42);
//! thread::spawn(move || {
//!     println!("{}", shared);
//! });
//! ```
//!
//! # 2. Non-`Sync` interior mutability (`RefCell`) cannot be shared via `&` across threads
//!
//! ```compile_fail,E0277
//! use std::cell::RefCell;
//! use std::sync::Arc;
//! use std::thread;
//!
//! let cell = Arc::new(RefCell::new(0));
//! let copy = Arc::clone(&cell);
//! thread::spawn(move || {
//!     *copy.borrow_mut() += 1;
//! });
//! ```
//!
//! # 3. `thread::spawn` rejects borrowing local stack data (`'static` bound)
//!
//! ```compile_fail,E0373
//! use std::thread;
//!
//! let batch = vec![10, 20, 30];
//! let handle = thread::spawn(|| batch.iter().sum::<i32>());
//! let _ = handle.join();
//! ```
//!
//! # 4. Holding a `std::sync::MutexGuard` across `.await` fails `Send` on multi-threaded Tokio
//!
//! ```compile_fail,E0277
//! use std::sync::{Arc, Mutex};
//!
//! async fn bad(counter: Arc<Mutex<u64>>) {
//!     let mut guard = counter.lock().unwrap();
//!     *guard += 1;
//!     tokio::task::yield_now().await;
//! }
//!
//! fn assert_send<T: Send>(_: T) {}
//! fn check(counter: Arc<Mutex<u64>>) {
//!     assert_send(bad(counter));
//! }
//! ```

use std::future::Future;
use std::pin::Pin;
use std::sync::{
    Arc, Mutex,
    atomic::{AtomicBool, AtomicUsize, Ordering},
};
use std::task::{Context, Poll, Wake, Waker};
use std::thread;

/// Sum slices in parallel using `std::thread::scope`, borrowing `values` on the stack with zero `Arc` or cloning.
pub fn scoped_parallel_sum(values: &[u64], chunks: usize) -> u64 {
    let chunk_size = values.len().div_ceil(chunks.max(1));
    thread::scope(|s| {
        let handles: Vec<_> = values
            .chunks(chunk_size)
            .map(|slice| s.spawn(move || slice.iter().sum::<u64>()))
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).sum()
    })
}

/// Mutate disjoint slices in place using `std::thread::scope` and `chunks_mut` with zero locks and zero copies.
pub fn scoped_parallel_scale(values: &mut [u64], factor: u64, chunks: usize) {
    let chunk_size = values.len().div_ceil(chunks.max(1));
    thread::scope(|s| {
        for slice in values.chunks_mut(chunk_size) {
            s.spawn(move || {
                for item in slice {
                    *item *= factor;
                }
            });
        }
    });
}

/// Bounded channel pipeline: producers push events under backpressure and the receiver drains until all senders drop.
pub fn bounded_channel_sum(items: &[u64], capacity: usize) -> u64 {
    let (tx, rx) = std::sync::mpsc::sync_channel::<u64>(capacity);
    thread::scope(|s| {
        s.spawn(move || {
            for &item in items {
                tx.send(item).unwrap();
            }
        });
        rx.into_iter().sum()
    })
}

/// Shared state via `Arc<Mutex<T>>` + lock-free `AtomicUsize`.
pub fn shared_counter_demo(threads: usize, increments: usize) -> (usize, usize) {
    let locked = Arc::new(Mutex::new(0usize));
    let atomic = Arc::new(AtomicUsize::new(0usize));
    thread::scope(|s| {
        for _ in 0..threads {
            let locked = Arc::clone(&locked);
            let atomic = Arc::clone(&atomic);
            s.spawn(move || {
                for _ in 0..increments {
                    *locked.lock().unwrap() += 1;
                    atomic.fetch_add(1, Ordering::Relaxed);
                }
            });
        }
    });
    let total_locked = *locked.lock().unwrap();
    let total_atomic = atomic.load(Ordering::Acquire);
    (total_locked, total_atomic)
}

/// Publish a payload across threads with an Acquire/Release atomic fence.
pub fn acquire_release_publish(value: u64) -> u64 {
    let slot = Mutex::new(0u64);
    let ready = AtomicBool::new(false);
    thread::scope(|s| {
        s.spawn(|| {
            *slot.lock().unwrap() = value;
            ready.store(true, Ordering::Release);
        });
        while !ready.load(Ordering::Acquire) {
            std::hint::spin_loop();
        }
        *slot.lock().unwrap()
    })
}

/// A minimal manual `Future` that demonstrates lazy execution, `Poll::Pending`, and `Waker` registration.
pub struct GateFuture {
    ready: Arc<AtomicBool>,
    waker: Arc<Mutex<Option<Waker>>>,
    polls: Arc<AtomicUsize>,
    dropped: Arc<AtomicBool>,
}

impl GateFuture {
    pub fn pair() -> (Self, GateHandle) {
        let ready = Arc::new(AtomicBool::new(false));
        let waker = Arc::new(Mutex::new(None));
        let polls = Arc::new(AtomicUsize::new(0));
        let dropped = Arc::new(AtomicBool::new(false));
        (
            Self {
                ready: Arc::clone(&ready),
                waker: Arc::clone(&waker),
                polls: Arc::clone(&polls),
                dropped: Arc::clone(&dropped),
            },
            GateHandle { ready, waker, polls, dropped },
        )
    }
}

impl Future for GateFuture {
    type Output = u64;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        self.polls.fetch_add(1, Ordering::SeqCst);
        if self.ready.load(Ordering::Acquire) {
            Poll::Ready(42)
        } else {
            *self.waker.lock().unwrap() = Some(cx.waker().clone());
            Poll::Pending
        }
    }
}

impl Drop for GateFuture {
    fn drop(&mut self) {
        self.dropped.store(true, Ordering::Release);
    }
}

pub struct GateHandle {
    ready: Arc<AtomicBool>,
    waker: Arc<Mutex<Option<Waker>>>,
    polls: Arc<AtomicUsize>,
    dropped: Arc<AtomicBool>,
}

impl GateHandle {
    pub fn open(&self) {
        self.ready.store(true, Ordering::Release);
        if let Some(waker) = self.waker.lock().unwrap().take() {
            waker.wake();
        }
    }

    pub fn poll_count(&self) -> usize {
        self.polls.load(Ordering::SeqCst)
    }

    pub fn was_dropped(&self) -> bool {
        self.dropped.load(Ordering::Acquire)
    }
}

pub struct CountingWaker(pub AtomicUsize);

impl Wake for CountingWaker {
    fn wake(self: Arc<Self>) {
        self.0.fetch_add(1, Ordering::SeqCst);
    }
}

/// An async function with two `.await` suspension points, used to inspect the compiler-generated state machine size.
pub async fn two_step_pipeline(id: u64) -> u64 {
    let header = id * 10;
    tokio::task::yield_now().await;
    let enriched = header + 7;
    tokio::task::yield_now().await;
    enriched
}
