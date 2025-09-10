// @/templates/beacon/src/pages/index.jsx
// Main template entry point that wraps pages with Layout

import React from 'react';
import Layout from './Layout';
import Home from './Home';
import About from './About';
import Spotlight from './Spotlight';
import Contact from './Contact';

// Page components that include the Layout wrapper
export const HomePage = (props) => (
  <Layout {...props} currentPageName="Home">
    <Home {...props} />
  </Layout>
);

export const AboutPage = (props) => (
  <Layout {...props} currentPageName="About">
    <About {...props} />
  </Layout>
);

export const SpotlightPage = (props) => (
  <Layout {...props} currentPageName="Spotlight">
    <Spotlight {...props} />
  </Layout>
);


export const ContactPage = (props) => (
  <Layout {...props} currentPageName="Contact">
    <Contact {...props} />
  </Layout>
);

// Default export for the template
export default HomePage;