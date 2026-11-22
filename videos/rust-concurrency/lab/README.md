# Rust Concurrency Lab

This Cargo package contains the compiled integration tests and compile-fail experiments shown in *Rust Concurrency: Ownership Across Time*. It uses the Rust 2024 edition with Tokio 1.54.1 and `tokio-util` 0.7.20.

## Run the tests

```sh
cargo test --offline
```

## What the suite verifies

- **Compile-fail doc tests** ([src/lib.rs](src/lib.rs)):
  - Moving an `Rc<i32>` across `std::thread::spawn` fails with `E0277` (`Rc` is `!Send`).
  - Sharing an `Arc<RefCell<i32>>` across threads fails with `E0277` (`RefCell` is `!Sync`).
  - Borrowing a local stack vector in `std::thread::spawn` fails with `E0373` (`'static` bound).
  - Holding a `std::sync::MutexGuard` across `.await` fails `Send` for multi-threaded Tokio tasks.
- **Runtime integration tests** ([tests/concurrency.rs](tests/concurrency.rs)):
  - `std::thread::scope` borrows and mutates disjoint slices (`chunks` and `chunks_mut`) from the stack with zero `Arc` allocations.
  - `Mutex` poisoning detects a thread that panicked while holding a `MutexGuard`.
  - `AtomicBool` with `Ordering::Release` and `Ordering::Acquire` publishes state safely across threads.
  - `std::sync::mpsc::sync_channel` applies backpressure and drains buffered items when all senders drop.
  - Tokio `mpsc` + `oneshot` actor mailbox (zero mutexes), `watch` latest-value config, and `broadcast` fan-out.
  - `GateFuture` demonstrates lazy construction, `Poll::Pending`, `Waker::wake`, and repolling to `Poll::Ready(42)`.
  - `two_step_pipeline` measures the compiler-generated async state machine size (48 bytes on `rustc 1.99.1`).
  - `tokio::sync::Semaphore` caps in-flight concurrency with RAII `OwnedSemaphorePermit`.
  - `tokio::select!` drops the losing future (running its `Drop` destructor) and confirms `mpsc::recv` is cancel-safe.
  - `tokio::task::JoinSet` aborts remaining background tasks when dropped.
  - `CancellationToken` and `tokio::task::spawn_blocking` coordinate graceful shutdown and blocking offload.
