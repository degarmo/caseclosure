import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function TipPage() {
  const [form, setForm] = useState({
    anonymous: false, name:'', email:'', phone:'', message:'', document:null
  });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [status, setStatus] = useState('');

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: type==='checkbox' ? checked : (files ? files[0] : value)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!captchaToken) return alert('Complete the CAPTCHA');
    const payload = new FormData();
    Object.entries(form).forEach(([k,v]) => v!=null && payload.append(k, v));
    payload.append('victim', window.location.host.split('.')[0]);
    payload.append('captcha_token', captchaToken);

    const resp = await fetch('http://127.0.0.1:8000/api/tips/submit/', {
      method: 'POST',
      body: payload,
    });
    if (resp.ok) setStatus('Thank you for your tip!');
    else setStatus('Error submitting tip.');
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <label>
        <input name="anonymous" type="checkbox"
               checked={form.anonymous} onChange={handleChange}/>
        Remain Anonymous
      </label>
      {!form.anonymous && <>
        <input name="name"  onChange={handleChange} placeholder="Name"/>
        <input name="email" onChange={handleChange} placeholder="Email"/>
        <input name="phone" onChange={handleChange} placeholder="Phone"/>
      </>}
      <textarea name="message" onChange={handleChange}
                placeholder="Your tip..." required/>
      <input type="file" name="document" onChange={handleChange}/>
      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITEKEY}
        onChange={setCaptchaToken}
      />
      <button type="submit">Submit Tip</button>
      {status && <p>{status}</p>}
    </form>
  );
}
