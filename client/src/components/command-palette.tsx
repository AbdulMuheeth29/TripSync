'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, PlusCircle, LogIn, LogOut, Home, Palette } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

export function CommandPalette() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => setLocation('/'))}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </CommandItem>
          {user && (
            <>
              <CommandItem onSelect={() => run(() => setLocation('/dashboard'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => run(() => setLocation('/create'))}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New trip
              </CommandItem>
            </>
          )}
        </CommandGroup>
        <CommandGroup heading="Account">
          {user ? (
            <CommandItem
              onSelect={() =>
                run(() => {
                  logout();
                  setLocation('/');
                })
              }
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </CommandItem>
          ) : (
            <CommandItem onSelect={() => run(() => setLocation('/login'))}>
              <LogIn className="mr-2 h-4 w-4" />
              Log in
            </CommandItem>
          )}
        </CommandGroup>
        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => run(toggleTheme)}>
            <Palette className="mr-2 h-4 w-4" />
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
