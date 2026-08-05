import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('submits a manually-entered task without calling the AI endpoint', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TaskForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText('Task title'), 'Fix nav overflow on mobile');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({ title: 'Fix nav overflow on mobile', priority: 'normal' });
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('AI triage fills in the suggested title and priority on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'Fix mobile nav overflow',
        priority: 'urgent',
        reasoning: 'Layout is broken for mobile users right now.',
      }),
    });

    const user = userEvent.setup();
    render(<TaskForm onAdd={vi.fn()} />);

    await user.type(screen.getByLabelText('Task title'), 'nav thing broken on phones asap');
    await user.click(screen.getByRole('button', { name: /AI triage/i }));

    expect(await screen.findByDisplayValue('Fix mobile nav overflow')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Priority' })).toHaveValue('urgent');
    expect(screen.getByText(/Layout is broken for mobile users/)).toBeInTheDocument();
  });

  test('falls back to manual entry when the AI endpoint fails, form stays usable', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'AI triage is not configured' }),
    });

    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TaskForm onAdd={onAdd} />);

    const input = screen.getByLabelText('Task title');
    await user.type(input, 'write onboarding docs');
    await user.click(screen.getByRole('button', { name: /AI triage/i }));

    // Error surfaces to the user, but doesn't wipe or block the field.
    expect(await screen.findByText(/AI suggestion unavailable/i)).toBeInTheDocument();
    expect(input).toHaveValue('write onboarding docs');

    // The form is still fully usable without AI, this is the resilience
    // requirement: the feature degrades, the core task never breaks.
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({ title: 'write onboarding docs', priority: 'normal' });
    });
  });
});
