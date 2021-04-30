window.JSUtils = window.JSUtils || {
  copyToClipboard: text => {
    var inp = document.createElement('input');
    inp.value = text;
    inp.style.position = 'fixed';
    inp.style.top = '-1000px';
    document.body.appendChild(inp);
    inp.focus();
    inp.select();
    inp.setSelectionRange(0, 99999);
    document.execCommand('copy');
    document.body.removeChild(inp);
  },

  //wait for document to be ready
  domReady: fn => {
    if (
      document.readyState === 'complete' ||
      (document.readyState !== 'loading' && !document.documentElement.doScroll)
    ) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  },

  //listen to an event with selector dynamically. the selector might yield empty result during assignment
  addGlobalEventListener: (parent, selector, eventName, fn) => {
    if (typeof parent === 'string') parent = document.querySelector(parent);
    parent.addEventListener(eventName, e => {
      parent.querySelectorAll(selector).forEach(elem => {
        if (elem.isSameNode(e.target)) {
          fn(e, elem);
        }
      });
    });
  },

  fetch: async (url, values) => {
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      credentials: 'same-origin',
      body: Object.keys(values).reduce((str, key) => `${str}&${key}=${values[key]}`, '')
    });
    response = await response.json();
    return response;
  }
};

//observers - call a list of functions when state changes
if (typeof window.StateManagerFactory === 'undefined') {
  window.StateManagerFactory = () => {
    class StateManager {
      state = {};

      constructor() {}

      emptyItem = () => {
        return {
          value: null,
          fns: []
        };
      };

      get = item => (this.state[item] ? this.state[item].value : undefined);

      set = (item, value) => {
        if (!this.state[item]) {
          this.state[item] = this.emptyItem();
        }

        //no change, no events
        if (value === this.state[item].value) return;

        this.state[item].value = value;
        this.state[item].fns.forEach(fn => fn(value));
      };

      listen = (item, fn) => {
        if (!this.state[item]) {
          this.state[item] = this.emptyItem();
        }
        this.state[item].fns.push(fn);
      };
    }

    return new StateManager();
  };
}
