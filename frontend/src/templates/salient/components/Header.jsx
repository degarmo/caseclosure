import React from "react";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverButton,
  PopoverBackdrop,
  PopoverPanel,
} from '@headlessui/react';
import clsx from 'clsx';

import { Button } from './Button';
import { Container } from './Container';
import LogoRenderer from "@/components/LogoRenderer";
import DynamicNavbar from "@/components/DynamicNavbar"; // Should render only nav links, not auth

function MobileNavLink({ to, children }) {
  return (
    <PopoverButton as={Link} to={to} className="block w-full p-2">
      {children}
    </PopoverButton>
  );
}

function MobileNavIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          'origin-center transition',
          open && 'scale-90 opacity-0',
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          'origin-center transition',
          !open && 'scale-90 opacity-0',
        )}
      />
    </svg>
  );
}

// Only dynamic pages in nav, static auth at right
function MobileNavigation({ pages }) {
  return (
    <Popover>
      <PopoverButton
        className="relative z-10 flex h-8 w-8 items-center justify-center focus:not-data-focus:outline-hidden"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </PopoverButton>
      <PopoverBackdrop
        transition
        className="fixed inset-0 bg-slate-300/50 duration-150 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in"
      />
      <PopoverPanel
        transition
        className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
      >
        {pages && pages.map(page => (
          <MobileNavLink key={page.slug} to={`/${page.slug}`}>
            {page.title}
          </MobileNavLink>
        ))}
        <hr className="m-2 border-slate-300/40" />
        <MobileNavLink to="/login">Sign in</MobileNavLink>
      </PopoverPanel>
    </Popover>
  );
}

export default function Header({ logo, pages = [] }) {
  return (
    <header className="py-10">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link to="/" aria-label="Home">
              <LogoRenderer logo={logo} />
            </Link>
            {/* Dynamic page navigation, desktop only */}
            <div className="hidden md:flex md:gap-x-6">
              <DynamicNavbar pages={pages} />
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            {/* Desktop: static links */}
            <div className="hidden md:block">
              <Link to="/login" className="text-slate-700 hover:text-blue-600 font-medium transition">
                Sign in
              </Link>
            </div>
            {/* Mobile: hamburger */}
            <div className="-mr-1 md:hidden">
              <MobileNavigation pages={pages} />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
