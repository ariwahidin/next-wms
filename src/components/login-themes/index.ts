// components/login-themes/index.ts
import ThemeModern from './ThemeModern';
import ThemeMinimal from './ThemeMinimal';
import ThemeDark from './ThemeDark';
import ThemeFullBg from './ThemeFullBg';
import ThemeNebula from './ThemeNebula';
import ThemeCard from './ThemeCard';
import { LoginConfig } from '@/types/company-config';
import React from 'react';

export type ThemeProps = {
    config: LoginConfig;
    onSubmit: (e: React.FormEvent) => void;
    username: string;
    password: string;
    setUsername: (v: string) => void;
    setPassword: (v: string) => void;
    isPreview?: boolean;
};

export type ThemeName = 'ThemeModern' | 'ThemeMinimal' | 'ThemeDark' | 'ThemeFullBg' | 'ThemeNebula' | 'ThemeCard';

export const THEME_META: Record<ThemeName, { label: string; description: string }> = {
    ThemeModern: {
        label: 'Modern',
        description: 'Split layout dengan carousel gambar dan gradient background',
    },
    ThemeMinimal: {
        label: 'Minimal',
        description: 'Clean dan elegan, fokus ke form tanpa distraksi',
    },
    ThemeDark: {
        label: 'Dark',
        description: 'Full dark mode dengan slideshow cinematic',
    },
    ThemeFullBg: {
        label: 'Full Background',
        description: 'Background penuh dengan gambar statis',
    },
    ThemeNebula: {
        label: 'Nebula',
        description: 'Tema dengan efek nebula dan warna langit yang menakjubkan',
    },
    ThemeCard: {
        label: 'Card',
        description: 'Tema dengan desain kartu yang modern dan menarik',
    }
};

const themes: Record<ThemeName, React.ComponentType<ThemeProps>> = {
    ThemeModern,
    ThemeMinimal,
    ThemeDark,
    ThemeFullBg,
    ThemeNebula,
    ThemeCard,
};

export default themes;