import Layout from "./Layout.jsx";

import Home from "./Home";

import About from "./About";

import Pricing from "./Pricing";

import Spotlight from "./Spotlight";

import Contact from "./Contact";

import Discover from "./Discover";

import RequestAccount from "./RequestAccount";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    About: About,
    
    Pricing: Pricing,
    
    Spotlight: Spotlight,
    
    Contact: Contact,
    
    Discover: Discover,
    
    RequestAccount: RequestAccount,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/Spotlight" element={<Spotlight />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/Discover" element={<Discover />} />
                
                <Route path="/RequestAccount" element={<RequestAccount />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}