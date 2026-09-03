// pages/auth/login.tsx
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setUser } from '@/store/userSlice';
import eventBus from '@/utils/eventBus';
import api from '@/lib/api';
import router from 'next/router';
import themes, { ThemeName } from '@/components/login-themes';
import { LoginConfig, DEFAULT_CONFIG } from '@/types/company-config';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState<LoginConfig>(DEFAULT_CONFIG);
  const dispatch = useAppDispatch();
  const dataUser = useSelector((state: RootState) => state.user);

  // ── Fetch company config (public endpoint, no auth) ───────────────────────
  useEffect(() => {
    api
      .get('/company-config/login')
      .then((res) => {
        if (res.data.success) setConfig(res.data.data);
      })
      .catch(() => {
        // Fallback ke DEFAULT_CONFIG kalau API gagal
      });
  }, []);

  // ── Check existing session ────────────────────────────────────────────────
  useEffect(() => {
    // const token = document.cookie
    //   .split('; ')
    //   .find((row) => row.startsWith('wms-auth-token='))
    //   ?.split('=')[1];

    // cek existing session
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME}=`))
      ?.split('=')[1];

    if (!token || token === 'undefined') return;

    api
      .get('/auth/is-logged-in', { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          eventBus.emit('loading', false);
          if (dataUser.base_url === '/dashboard') {
            router.push('/wms/dashboard');
          } else {
            router.push('/mobile/home');
          }
        } else {
          // Clear stale cookies
          document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          });
        }
      })
      .catch(console.error);
  }, []);

  // ── Submit login (logic tidak berubah) ───────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    eventBus.emit('loading', true);

    api
      .post('/auth/login', { email: username, password }, { withCredentials: true })
      .then((res) => {
        eventBus.emit('loading', false);
        if (res.data.success === true) {
          dispatch(
            setUser({
              name: res.data.user.name,
              email: res.data.user.email,
              base_url: res.data.user.base_url,
              token: res.data.x_token,
              menus: res.data.menus,
              unit: res.data.user.unit,
              roles: res.data.user.roles,
              permissions: res.data.permissions,
            })
          );
          // document.cookie = `wms-auth-token=${res.data.x_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          // pas set cookie setelah login
          document.cookie = `${process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME}=${res.data.x_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          if (res.data.user.base_url === '/dashboard') {
            router.push('/wms/dashboard');
          } else {
            router.push('/mobile/home');
          }
        }
      })
      .catch((err) => {
        eventBus.emit('loading', false);
        const status = err.response?.status;
        if (status === 409) {
          const conflictId = err.response.data?.conflict_id;
          router.push(`/auth/conflict?cid=${conflictId}`);
          return;
        }
        console.error(err);
      });
  };

  // ── Render theme yang dipilih di config ──────────────────────────────────
  const themeName = (config.login_theme ?? 'ThemeModern') as ThemeName;
  const Theme = themes[themeName] ?? themes['ThemeModern'];

  return (
    <Theme
      config={config}
      onSubmit={handleSubmit}
      username={username}
      password={password}
      setUsername={setUsername}
      setPassword={setPassword}
    />
  );
}