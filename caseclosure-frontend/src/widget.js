// src/widget.js
import React from 'react';
import ReactDOM from 'react-dom';
import TipForm from './TipPage.jsx'; // tweak to accept props

export function init({container, apiBase, victim, recaptchaSiteKey}) {
  ReactDOM.render(
    <TipForm apiBase={apiBase} victimSubdomain={victim}
      recaptchaKey={recaptchaSiteKey}/>,
    document.querySelector(container)
  );
}
