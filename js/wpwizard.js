const questionnaire = {
  steps: [
    {
      id: 'experience',
      type: 'american',
      question: 'האם יש לך ניסיון בהשקעות בשוק ההון?',
      options: [
        { text: 'אין לי בכלל ידע או ניסיון בהשקעות', value: 'none' },
        { text: 'יש לי קצת ניסיון והבנה בסיסית בהשקעות', value: 'some' },
        { text: 'אני כבר משקיע מספר שנים ויש לי ניסיון', value: 'experienced' }
      ]
    },
    {
      id: 'investor_type',
      type: 'american',
      question: 'איזה סוג משקיע אתה?',
      options: [
        { text: 'משקיע סולידי - שונא סיכון ותנודתיות', value: 'solid' },
        { text: 'משקיע זהיר - מוכן לקצת סיכון', value: 'cautious' },
        {
          text: 'משקיע אמיץ - מוכן להסתכן ולהשקיע ברעיונות עם פוטנציאל גדול',
          value: 'risky'
        }
      ]
    },
    {
      id: 'term',
      type: 'american',
      question: 'לאיזה טווח זמן אתה מתכוון להשקיע ברציפות?',
      options: [
        { text: 'פחות מ-5 שנים', value: 'short' },
        { text: '5-15 שנים', value: 'medium' },
        { text: 'מעל 15 שנה', value: 'long' }
      ]
    },
    {
      id: 'interest',
      type: 'american',
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
    },
    {
      id: 'email',
      type: 'input',
      class: 'addressee-step',
      text: `כל הכבוד על הזמן שהקדשת!<br/><br/>
        זה מוכיח שאת/ה רוצה להשקיע את כספך בחכמה ובהצלחה.
        התשובות שענית עזרו לי להבין איזו דרך השקעה הכי מתאימה עבורך.<br/>
        אני רוצה לשלוח לך באופן אישי את התובנות שלי בעניין כדי שתוכלו להתעמק בדברים וליישם אותם בהצלחה לאורך זמן.<br/>
        באותה הזדמנות אשלח לך גם מתנה קטנה ממני - מניה מעניינת במיוחד לתקופה זו, שאני מאמין שיש לה פוטנציאל צמיחה משמעותי בשנים הקרובות.<br/><br/>
        לאיזה מייל לשלוח לך את זה?
        `,
      showAgree: true,
      validator: 'email'
    }
  ]
};

class WPWizard {
  original = null;
  options = null;
  state = null;
  questionnaire = null;

  validators = {
    email: val => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
        return { error: true, message: 'invalidEmail' };
      return { error: false };
    }
  };

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
        finish: 'שלח לי את התוצאות',
        agree: 'אני מסכים לקבלת דיוור במייל',
        processing: 'אנא המתן בזמן שאנחנו מעבדים את הנתונים שלך',
        errors: {
          invalidEmail: 'כתובת מייל לא חוקית'
        }
      },
      ...options
    };
    this.options = opts;

    this.questionnaire = questionnaire;

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
        if (this.isLastStep()) {
          this.renderProcessing(this.renderResults);
        } else {
          let step = this.state.get('step');
          this.state.set('step', step + 1);
        }
      }
    );

    JSUtils.addGlobalEventListener(
      this.container,
      '.answers input, .input-answer input',
      'change',
      this.inputChange
    );
    JSUtils.addGlobalEventListener(
      this.container,
      '.addressee-step .input-answer input',
      'keyup',
      e => {
        let next = document.querySelector('button.next');
        if (!this.validators.email(e.target.value).error) {
          next.removeAttribute('disabled');
          next.classList.remove('disabled');
        } else {
          next.setAttribute('disabled', true);
          next.classList.add('disabled');
        }
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

  inputChange = e => {
    let answers = this.state.get('answers') || {};
    let step = this.state.get('step');
    let value = null;
    let stepId = this.questionnaire.steps[step].id;

    switch (e.target.type) {
      case 'radio':
      case 'checkbox':
        answers[stepId] = e.target.getAttribute('data-value');
        break;
      case 'text':
        answers[stepId] = e.target.value.trim();
    }
    this.state.set('answers', { ...answers });
    console.dir(answers);
    this.render();
  };

  renderProcessing = cb => {
    this.container.innerHTML = `
      <div class='step'>
        <div class='question'>${this.options.texts.processing}</div>
        <div class='hero'>&nbsp;</div>
        <div class='answers'>
        </div>
        <div class='navigation'>
        </div>
        <div class='progress'>
        </div>
      </div>
    `;

    let data = { ...this.state.get('answers'), action: 'save_wizard_results' };
    JSUtils.fetch(wpwizard.ajax_url, data).then(cb);
  };

  renderResults = () => {
    this.container.innerHTML = `
    <div class='step'>
      <div class='question'>Your results are ready</div>
      <div class='hero'>&nbsp;</div>
      <div class='answers'>
      </div>
      <div class='navigation'>
      </div>
      <div class='progress'>
      </div>
    </div>
  `;
  };

  show = () => {
    switch (this.options.type) {
      case 'inline':
        this.showInline();
        break;
    }
  };

  isLastStep = () => {
    const { steps } = this.questionnaire;
    let step = this.state.get('step');
    return step === steps.length - 1;
  };

  renderAmerican = () => {
    const { steps } = this.questionnaire;

    const step = this.state.get('step');
    const curr = steps[step];

    let answer = this.state.get('answers')[curr.id];

    const options = curr.options
      .map(
        option =>
          `<li class='${
            answer === option.value ? 'selected' : ''
          }'><label><input name= 'question_${
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

    this.container.innerHTML = `
      <div class='step'>
        <div class='question'>${curr.question}</div>
        <div class='hero'>&nbsp;</div>
        <ul class='answers'>
          ${options}
        </ul>
        <div class='navigation'>
        ${backButton}
        <button class='next ${!answer ? 'disabled' : ''}' ${
      !answer && 'disabled'
    }>${
      this.isLastStep()
        ? this.options.texts.finish
        : this.options.texts.continue
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

  renderInput = () => {
    const { steps } = this.questionnaire;

    const step = this.state.get('step');
    const curr = steps[step];

    let answer = this.state.get('answers')[curr.id] || '';

    let validationResult = curr.validator
      ? this.validators[curr.validator](answer)
      : false;
    let valid = !validationResult.error;

    const pct = parseInt(((step + 1) / steps.length) * 100);

    const backButton =
      step > 0 && this.options.show.backButton
        ? `<button class='back'>&#8594; ${this.options.texts.back}</button>`
        : '<span>&nbsp;</span>';
    const progressText = this.options.show.progressText
      ? `<div class='progress-text'>${step + 1} מתוך ${steps.length}</div>`
      : '<span>&nbsp;</span>';

    this.container.innerHTML = `
      <div class='step ${curr.class || ''}'>
        <div class='text'>
          ${curr.text}
        </div>
        <div class='input-answer input'>
          ${
            !valid && answer.length > 0
              ? `<span class='error'>${
                  this.options.texts.errors[validationResult.message]
                }</span>`
              : ''
          }
          <input type='text' name='question_${curr.id}' value='${answer}'/>
          ${
            curr.showAgree
              ? `<label class='agree'><input type='checkbox' disabled checked>${this.options.texts.agree}</label>`
              : ''
          }
        </div>
        <div class='navigation'>
        ${backButton}
        <button class='next ${!valid ? 'disabled' : ''}' ${
      !valid ? 'disabled' : ''
    }>${
      this.isLastStep()
        ? this.options.texts.finish
        : this.options.texts.continue
    } &#8592;</button>
        </div>
      </div>
    `;
  };

  render = () => {
    const { steps } = this.questionnaire;

    const step = this.state.get('step');
    const curr = steps[step];

    switch (curr.type) {
      case 'american':
        this.renderAmerican();
        break;
      case 'input':
        this.renderInput();
        break;
      default:
        this.container.innerHTML = 'Unsupported step type';
    }
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

  //Use this only for cleaning original content
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

  //Restore original content
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
