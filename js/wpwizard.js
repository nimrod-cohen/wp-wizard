const questionnaire = {
  steps: [
    {
      question: 'האם יש לך ניסיון בהשקעות בשוק ההון?',
      options: [
        'אין לי בכלל ידע או ניסיון בהשקעות',
        'יש לי קצת ניסיון והבנה בסיסית בהשקעות',
        'אני כבר משקיע מספר שנים ויש לי ניסיון'
      ]
    },
    {
      question: 'איזה סוג משקיע אתה?',
      options: [
        'משקיע סולידי - שונא סיכון ותנודתיות',
        'משקיע זהיר - מוכן לקצת סיכון',
        'משקיע אמיץ - מחפש להשקיע באפיקים ורעיונות שיכולים להצליח בגדול, או להיכשל בגדול'
      ]
    },
    {
      question: 'לאיזה טווח זמן אתה מתכוון להשקיע ברציפות?',
      options: ['פחות מ-5 שנים', '5-15 שנים', 'מעל 15 שנה']
    },
    {
      question: 'עד כמה שוק ההון מעניין אותך?',
      options: [
        'ממש לא מעניין',
        'קצת מעניין אותי - אני רוצה להבין את הדברים הבסיסיים בהשקעות',
        'מאוד מעניין אותי - אני רוצה לדעת להשקיע כמו וורן באפט'
      ]
    }
  ]
};

class WPWizard {
  original = null;
  options = null;
  state = null;

  constructor(options) {
    let opts = {
      type: 'inline',
      hideBackground: false,
      ...options
    };
    this.options = opts;

    this.container = this.getContainer();
    this.container.classList.add('wpwizard');
    this.state = StateManagerFactory();
    this.state.listen('step', this.render);

    JSUtils.addGlobalEventListener(
      this.container,
      '.navigation .next',
      'click',
      () => {
        let step = this.state.get('step');
        this.state.set('step', step + 1);
      }
    );
  }

  show = () => {
    switch (this.options.type) {
      case 'inline':
        this.showInline();
        break;
    }
  };

  render = step => {
    let curr = questionnaire.steps[step];
    let answers = curr.options.map(option => `<li>${option}</li>`).join('');

    this.clear(() => {
      this.container.innerHTML = `
      <div class='step'>
        <div class='step-question'>${curr.question}</div>
        <ul class='step-answers'>
          ${answers}
        </ul>
        <div class='navigation'>
          <button class='next'>next question</button>
        </div>
      </div>
    `;
    });
  };

  getContainer = () => {
    let { selector } = this.options;
    return document.querySelector(selector);
  };

  start = () => {
    this.original = {
      html: this.container.innerHTML,
      backgroundImage: this.container.style.backgroundImage,
      backgroundColor: this.container.style.backgroundColor
    };

    this.state.set('step', 0);
  };

  clear = cb => {
    let height = this.container.offsetHeight;
    this.container.style.height = `${height}px`;
    this.container.style.minHeight = `${height}px`;

    if (this.options.hideBackground) {
      this.container.style.backgroundImage = 'none';
      this.container.style.backgroundColor = 'white';
    }

    this.container.classList.add('fade');

    setTimeout(() => {
      this.container.innerHTML = '';
      this.container.classList.remove('fade');
      cb();
    }, 1000);
  };

  restore = () => {
    this.container.innerHTML = this.original.html;
    if (this.options.hideBackground) {
      this.container.style.backgroundImage = this.original.backgroundImage;
      this.container.style.backgroundColor = this.original.backgroundColor;
    }
  };

  showInline = () => {
    this.start();
  };
}

JSUtils.domReady(() => {
  window.addEventListener('message', event => {
    let wpwizard = event?.data?.wpwizard;
    if (!wpwizard) return;

    let wizard = new WPWizard(event.data);

    wizard.show();
  });
});
