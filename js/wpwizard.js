const questionnaire = {
  steps: [
    {
      id: '1',
      question: 'האם יש לך ניסיון בהשקעות בשוק ההון?',
      options: [
        { text: 'אין לי בכלל ידע או ניסיון בהשקעות', value: 'none' },
        { text: 'יש לי קצת ניסיון והבנה בסיסית בהשקעות', value: 'some' },
        { text: 'אני כבר משקיע מספר שנים ויש לי ניסיון', value: 'experienced' }
      ]
    },
    {
      id: '2',
      question: 'איזה סוג משקיע אתה?',
      options: [
        { text: 'משקיע סולידי - שונא סיכון ותנודתיות', value: 'solid' },
        { text: 'משקיע זהיר - מוכן לקצת סיכון', value: 'cautious' },
        {
          text:
            'משקיע אמיץ - מחפש להשקיע באפיקים ורעיונות שיכולים להצליח או להיכשל בגדול',
          value: 'risky'
        }
      ]
    },
    {
      id: '3',
      question: 'לאיזה טווח זמן אתה מתכוון להשקיע ברציפות?',
      options: [
        { text: 'פחות מ-5 שנים', value: 'short' },
        { text: '5-15 שנים', value: 'medium' },
        { text: 'מעל 15 שנה', value: 'long' }
      ]
    },
    {
      id: '4',
      question: 'עד כמה שוק ההון מעניין אותך?',
      options: [
        { text: 'ממש לא מעניין', value: 'follower' },
        {
          text: 'קצת מעניין אותי - אני רוצה להבין את הדברים הבסיסיים בהשקעות',
          value: 'strategic'
        },
        {
          text: 'מאוד מעניין אותי - אני רוצה לדעת להשקיע כמו וורן באפט',
          value: 'investor'
        }
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
      show: {
        backButton: true,
        progressText: true
      },
      texts: {
        continue: 'המשך',
        back: 'חזור',
        finish: 'לחץ לקבלת התוצאות'
      },
      ...options
    };
    this.options = opts;

    this.container = this.getContainer();
    this.container.classList.add('wpwizard');
    this.state = StateManagerFactory();
    this.state.set('answers', {});

    this.state.listen('step', step => {
      this.clear(() => this.render(step));
    });

    this.state.listen('answers', this.render);

    JSUtils.addGlobalEventListener(
      this.container,
      '.navigation .next',
      'click',
      () => {
        let step = this.state.get('step');
        this.state.set('step', step + 1);
      }
    );

    JSUtils.addGlobalEventListener(
      this.container,
      '.answers input',
      'change',
      e => {
        let answers = this.state.get('answers') || {};
        let step = this.state.get('step');
        answers[step] = e.target.getAttribute('data-value');
        this.state.set(answers);
        this.render();
      }
    );
    JSUtils.addGlobalEventListener(
      this.container,
      '.navigation .back',
      'click',
      () => {
        let step = this.state.get('step');
        this.state.set('step', step - 1);
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

  render = () => {
    const { steps } = questionnaire;

    const step = this.state.get('step');
    const curr = steps[step];

    let answer = this.state.get('answers')[step];

    const options = curr.options
      .map(
        option =>
          `<li><label><input name= 'question_${
            curr.id
          }' type='radio' data-value='${option.value}' ${
            answer === option.value ? 'checked' : ''
          } />${option.text}</li>`
      )
      .join('');
    const pct = parseInt(((step + 1) / steps.length) * 100);

    const backButton =
      step > 0 && this.options.show.backButton
        ? `<button class='back'>&#8594; ${this.options.texts.back}</button>`
        : '<span>&nbsp;</span>';
    const progressText = this.options.show.progressText
      ? `<div class='progress-text'>${step + 1} מתוך ${steps.length}</div>`
      : '<span>&nbsp;</span>';

    const isLastStep = step === steps.length - 1;

    this.container.innerHTML = `
      <div class='step'>
        <div class='question'>${curr.question}</div>
        <div class='hero'>&nbsp;</div>
        <ul class='answers'>
          ${options}
        </ul>
        <div class='navigation'>
        ${backButton}
        <button class='next ${!answer && 'disabled'}' ${
      !answer && 'disabled'
    }>${
      isLastStep ? this.options.texts.finish : this.options.texts.continue
    } &#8592;</button>
        </div>
        <div class='progress'>
          ${progressText}
          <div class='progress-bar'>
            <div class='progress-percentage' style='width:${pct}%'>&nbsp;</div>
          </div>
        </div>
      </div>
    `;
  };

  getContainer = () => {
    let { selector } = this.options;
    return document.querySelector(selector);
  };

  start = () => {
    this.original = {
      html: this.container.innerHTML,
      height: this.container.style.height,
      minHeight: this.container.style.minHeight
    };

    if (this.options.hideBackground) {
      this.container.classList.add('hide-background');
    }

    this.state.set('step', 0);
  };

  clear = cb => {
    //keeping the container in its original size.
    let height = this.container.offsetHeight;
    this.container.style.height = `${height}px`;
    this.container.style.minHeight = `${height}px`;

    this.container.classList.add('fade');

    setTimeout(() => {
      this.container.innerHTML = '';
      this.container.classList.remove('fade');
      cb();
    }, 500);
  };

  restore = () => {
    this.container.innerHTML = this.original.html;
    if (this.options.hideBackground) {
      this.container.classList.remove('hide-background');
      this.container.style.height = this.original.height;
      this.container.style.minHeight = this.original.minHeight;
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
