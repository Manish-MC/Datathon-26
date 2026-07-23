class PollingManager {
  constructor() {
    this.polls = {}; // key -> { fetchFn, interval, listeners, timeout, data, error, inFlight, failures, hasFetched }
  }

  subscribe(key, fetchFn, interval, callback) {
    if (!this.polls[key]) {
      this.polls[key] = {
        fetchFn,
        interval,
        listeners: new Set(),
        timeout: null,
        data: null,
        error: null,
        inFlight: false,
        failures: 0,
        hasFetched: false
      };
      this.execute(key);
    }
    
    this.polls[key].listeners.add(callback);
    
    // Call immediately if we already have a resolved state
    if (this.polls[key].hasFetched) {
      callback(this.polls[key].data, this.polls[key].error);
    }
    
    return () => {
      if (this.polls[key]) {
        this.polls[key].listeners.delete(callback);
        if (this.polls[key].listeners.size === 0) {
          clearTimeout(this.polls[key].timeout);
          delete this.polls[key];
        }
      }
    };
  }

  async execute(key) {
    const poll = this.polls[key];
    if (!poll || poll.inFlight) return;

    if (document.hidden) {
      // Pause polling while tab is hidden, check again next interval
      poll.timeout = setTimeout(() => this.execute(key), poll.interval);
      return;
    }

    poll.inFlight = true;
    try {
      const data = await poll.fetchFn();
      if (this.polls[key]) {
        this.polls[key].data = data;
        this.polls[key].error = null;
        this.polls[key].failures = 0; // reset on success
        this.polls[key].hasFetched = true;
        this.notify(key);
      }
    } catch (err) {
      if (this.polls[key]) {
        this.polls[key].error = err;
        this.polls[key].failures += 1;
        this.polls[key].hasFetched = true;
        this.notify(key);
      }
    } finally {
      if (this.polls[key]) {
        this.polls[key].inFlight = false;
        // Proceed at the standard interval whether successful or failed
        this.polls[key].timeout = setTimeout(() => this.execute(key), this.polls[key].interval);
      }
    }
  }

  notify(key) {
    const poll = this.polls[key];
    if (poll) {
      poll.listeners.forEach(cb => cb(poll.data, poll.error));
    }
  }
}

export const pollingManager = new PollingManager();
