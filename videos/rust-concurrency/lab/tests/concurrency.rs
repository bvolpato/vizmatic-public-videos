use rust_concurrency_lab::{
    CountingWaker, GateFuture, acquire_release_publish, bounded_channel_sum, scoped_parallel_scale,
    scoped_parallel_sum, shared_counter_demo, two_step_pipeline,
};
use std::future::Future;
use std::pin::pin;
use std::sync::{
    Arc, Mutex,
    atomic::{AtomicUsize, Ordering},
};
use std::task::{Context, Poll, Waker};
use std::thread;
use std::time::Duration;
use tokio::sync::{Semaphore, broadcast, mpsc, oneshot, watch};
use tokio::task::JoinSet;
use tokio_util::sync::CancellationToken;

#[test]
fn scoped_threads_borrow_and_mutate_local_stack_data() {
    let mut events: Vec<u64> = (1..=100).collect();
    assert_eq!(scoped_parallel_sum(&events, 4), 5050);
    scoped_parallel_scale(&mut events, 2, 4);
    assert_eq!(events.iter().sum::<u64>(), 10_100);
}

#[test]
fn mutex_poisons_when_guard_holder_panics() {
    let shared = Arc::new(Mutex::new(10u64));
    let clone = Arc::clone(&shared);
    let _ = thread::spawn(move || {
        let mut guard = clone.lock().unwrap();
        *guard = 99;
        panic!("simulated invariant break");
    })
    .join();

    let err = shared.lock().unwrap_err();
    assert_eq!(*err.into_inner(), 99);
}

#[test]
fn acquire_release_publishes_state_without_race() {
    assert_eq!(acquire_release_publish(4242), 4242);
}

#[test]
fn bounded_channel_transfers_ownership_and_drains() {
    let events: Vec<u64> = (1..=64).collect();
    assert_eq!(bounded_channel_sum(&events, 4), 2080);
}

#[test]
fn mutex_and_atomics_agree_under_contention() {
    let (locked, atomic) = shared_counter_demo(4, 1_000);
    assert_eq!(locked, 4_000);
    assert_eq!(atomic, 4_000);
}

#[test]
fn future_is_lazy_and_progresses_on_wake_then_repoll() {
    let (gate, handle) = GateFuture::pair();
    assert_eq!(handle.poll_count(), 0);

    let counter = Arc::new(CountingWaker(AtomicUsize::new(0)));
    let waker = Waker::from(Arc::clone(&counter));
    let mut cx = Context::from_waker(&waker);
    let mut pinned = pin!(gate);

    assert_eq!(pinned.as_mut().poll(&mut cx), Poll::Pending);
    assert_eq!(handle.poll_count(), 1);
    assert_eq!(counter.0.load(Ordering::SeqCst), 0);

    handle.open();
    assert_eq!(counter.0.load(Ordering::SeqCst), 1);
    assert_eq!(handle.poll_count(), 1);

    assert_eq!(pinned.as_mut().poll(&mut cx), Poll::Ready(42));
    assert_eq!(handle.poll_count(), 2);
}

#[test]
fn async_state_machine_is_compact_without_os_stack() {
    let fut = two_step_pipeline(4);
    let bytes = std::mem::size_of_val(&fut);
    assert!(bytes <= 128, "expected compact state machine, got {bytes} bytes");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn tokio_channel_patterns_actor_watch_and_broadcast() {
    // 1. Actor mailbox (mpsc) + request/reply (oneshot): zero Mutex needed!
    enum Cmd {
        Add(u64),
        Total(oneshot::Sender<u64>),
    }
    let (tx, mut rx) = mpsc::channel::<Cmd>(4);
    let actor = tokio::spawn(async move {
        let mut total = 0u64;
        while let Some(cmd) = rx.recv().await {
            match cmd {
                Cmd::Add(n) => total += n,
                Cmd::Total(reply) => {
                    let _ = reply.send(total);
                }
            }
        }
    });
    tx.send(Cmd::Add(17)).await.unwrap();
    tx.send(Cmd::Add(25)).await.unwrap();
    let (reply_tx, reply_rx) = oneshot::channel();
    tx.send(Cmd::Total(reply_tx)).await.unwrap();
    assert_eq!(reply_rx.await.unwrap(), 42);
    drop(tx);
    actor.await.unwrap();

    // 2. watch: latest-value config broadcast
    let (cfg_tx, mut cfg_rx) = watch::channel(100u32);
    cfg_tx.send(250).unwrap();
    cfg_tx.send(500).unwrap();
    assert!(cfg_rx.has_changed().unwrap());
    assert_eq!(*cfg_rx.borrow_and_update(), 500);

    // 3. broadcast: multi-consumer fan-out
    let (ev_tx, mut sub_a) = broadcast::channel::<&str>(4);
    let mut sub_b = ev_tx.subscribe();
    ev_tx.send("deploy").unwrap();
    assert_eq!(sub_a.recv().await.unwrap(), "deploy");
    assert_eq!(sub_b.recv().await.unwrap(), "deploy");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn semaphore_caps_inflight_concurrency() {
    let limit = Arc::new(Semaphore::new(2));
    let active = Arc::new(AtomicUsize::new(0));
    let peak = Arc::new(AtomicUsize::new(0));
    let mut set = JoinSet::new();

    for _ in 0..8 {
        let permit = Arc::clone(&limit).acquire_owned().await.unwrap();
        let active = Arc::clone(&active);
        let peak = Arc::clone(&peak);
        set.spawn(async move {
            let _permit = permit;
            let now = active.fetch_add(1, Ordering::SeqCst) + 1;
            peak.fetch_max(now, Ordering::SeqCst);
            tokio::time::sleep(Duration::from_millis(8)).await;
            active.fetch_sub(1, Ordering::SeqCst);
        });
    }
    while set.join_next().await.is_some() {}
    assert!(peak.load(Ordering::SeqCst) <= 2);
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn select_drops_losing_future_and_mpsc_recv_is_cancel_safe() {
    let (gate, handle) = GateFuture::pair();
    let winner = tokio::select! {
        val = gate => format!("gate:{val}"),
        _ = tokio::time::sleep(Duration::from_millis(15)) => "timeout".to_string(),
    };
    assert_eq!(winner, "timeout");
    assert!(handle.was_dropped(), "losing branch must be dropped by select!");

    // Cancel-safe mpsc::recv never loses a message when another select! arm fires.
    let (tx, mut rx) = mpsc::channel::<u64>(4);
    tokio::select! {
        biased;
        _ = tokio::time::sleep(Duration::from_millis(5)) => {}
        _ = rx.recv() => unreachable!(),
    }
    tx.send(99).await.unwrap();
    assert_eq!(rx.recv().await, Some(99));
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn join_set_tracks_and_aborts_remaining_tasks_on_drop() {
    let cancelled = Arc::new(AtomicUsize::new(0));
    let mut set = JoinSet::new();
    for i in 0..4u64 {
        let c = Arc::clone(&cancelled);
        struct OnDrop(Arc<AtomicUsize>);
        impl Drop for OnDrop {
            fn drop(&mut self) {
                self.0.fetch_add(1, Ordering::SeqCst);
            }
        }
        let guard = OnDrop(c);
        set.spawn(async move {
            let _keep = guard;
            let (gate, _h) = GateFuture::pair();
            if i == 0 {
                return 100;
            }
            gate.await
        });
    }
    let first = set.join_next().await.unwrap().unwrap();
    assert_eq!(first, 100);
    drop(set);
    tokio::time::sleep(Duration::from_millis(20)).await;
    assert_eq!(cancelled.load(Ordering::SeqCst), 4);
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn cancellation_token_and_spawn_blocking_cooperate() {
    let token = CancellationToken::new();
    let child = token.child_token();

    let bg = tokio::spawn(async move {
        child.cancelled().await;
        "drained"
    });

    let blocking_result = tokio::task::spawn_blocking(|| {
        std::thread::sleep(Duration::from_millis(10));
        (1..=100u64).sum::<u64>()
    })
    .await
    .unwrap();
    assert_eq!(blocking_result, 5050);

    token.cancel();
    assert_eq!(bg.await.unwrap(), "drained");
}
