/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import logoImg from '../assets/images/cusantar_logo_dark_1780813453174.png';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  let dims = { width: 140, height: 60 };
  if (size === 'sm') {
    dims = { width: 95, height: 42 };
  } else if (size === 'lg') {
    dims = { width: 220, height: 95 };
  }

  return (
    <div id="brand-logo" className={`flex items-center justify-center select-none ${className}`}>
      <img
        src={logoImg}
        alt="CusAntar Logo"
        style={{ width: `${dims.width}px`, height: `${dims.height}px` }}
        className="object-contain mix-blend-screen"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
