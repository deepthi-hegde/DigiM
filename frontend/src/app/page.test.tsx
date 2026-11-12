import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Platforms, CampaignDashboard } from './page';

// Mock global fetch
global.fetch = jest.fn();

describe('Platforms Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).FB;
    delete (window as any).fbAsyncInit;
    process.env.NEXT_PUBLIC_META_APP_ID = "test_app_id";
    window.showNotification = jest.fn();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/meta/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: false, page_name: '' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  it('renders correctly', () => {
    render(<Platforms />);
    expect(screen.getByText('Connect Platforms')).toBeTruthy();
    expect(screen.getAllByText('Facebook Page')[0]).toBeTruthy();
    expect(screen.getByText('Instagram Business')).toBeTruthy();
  });

  it('handles FB.login missing (out of bounds)', async () => {
    render(<Platforms />);
    const connectFbButton = screen.getAllByText('Connect', { selector: 'button', exact: false })[0];
    fireEvent.click(connectFbButton);
    
    expect(window.showNotification).toHaveBeenCalledWith(
      'Facebook SDK is still loading. Please try again in a moment.',
      'error'
    );
  });

  it('handles FB login success', async () => {
    (window as any).FB = {
      init: jest.fn(),
      _initialized: true,
      login: jest.fn().mockImplementation((cb) => {
        cb({ authResponse: { accessToken: "test_token" } });
      })
    };

    let isConnected = false;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/meta/pages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: "123", name: "SriKrish", access_token: "page_token" }]
          })
        });
      }
      if (url.includes('/api/meta/connect')) {
        isConnected = true;
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/meta/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: isConnected, page_name: isConnected ? 'SriKrish' : '' })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<Platforms />);
    const connectFbButton = screen.getAllByText('Connect', { selector: 'button' })[0];
    
    fireEvent.click(connectFbButton); // First connect button is Facebook

    // Wait for the Page Selector to appear
    await waitFor(() => {
      expect(screen.getByText('Select Facebook Page')).toBeTruthy();
    });

    // Click confirm
    const confirmButton = screen.getByText('Confirm & Connect');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('✓ Connected')).toBeTruthy();
      expect(screen.getByText('Connected as SriKrish')).toBeTruthy();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/meta/connect", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        tenant_id: 1, 
        page_id: "123",
        page_name: "SriKrish",
        access_token: "page_token",
        user_access_token: "test_token"
      })
    }));
  });
});

describe('CampaignDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.showNotification = jest.fn();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/storage/assets') || url.includes('/api/campaigns')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  it('renders correctly', () => {
    render(<CampaignDashboard />);
    expect(screen.getByText('Campaign Setup')).toBeTruthy();
    expect(screen.getByText('Create and publish your next promotion')).toBeTruthy();
  });

  it('generates campaign text correctly', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/campaign/generate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', generated_text: "Here is your awesome ad!" })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<CampaignDashboard />);
    const user = userEvent.setup();

    const promptInput = screen.getByPlaceholderText(/e.g., Promote our new summer silk collection.../i);
    await user.type(promptInput, "Test prompt");

    const generateButton = screen.getByText('✨ Generate AI Content');
    fireEvent.click(generateButton);

    expect(screen.getByText('✨ AI is designing...')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText(/Here is your awesome ad!/i)).toBeTruthy();
    });
  });

  it('handles negative edge case: API error', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/campaign/generate')) {
        return Promise.reject(new Error("API Error"));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<CampaignDashboard />);
    const user = userEvent.setup();
    const promptInput = screen.getByPlaceholderText(/e.g., Promote our new summer silk collection.../i);
    await user.type(promptInput, "Test prompt");
    
    const generateButton = screen.getByText('✨ Generate AI Content');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(window.showNotification).toHaveBeenCalledWith('Error generating campaign content', 'error');
    });
  });

  it('publishes generated campaign correctly', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/campaign/generate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', generated_text: "Here is your awesome ad!" })
        });
      }
      if (url.includes('/api/campaign/publish')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Published successfully!" })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<CampaignDashboard />);
    const user = userEvent.setup();
    const promptInput = screen.getByPlaceholderText(/e.g., Promote our new summer silk collection.../i);
    await user.type(promptInput, "Test prompt");

    fireEvent.click(screen.getByText('✨ Generate AI Content'));

    await waitFor(() => {
      expect(screen.getByText(/Here is your awesome ad!/i)).toBeTruthy();
    });

    const publishButton = screen.getByText(/Publish to Facebook|Publish to Meta/i);
    fireEvent.click(publishButton);

    expect(screen.getByText('Publishing...')).toBeTruthy();

    await waitFor(() => {
      expect(window.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Published successfully'),
        'success'
      );
    });
  });

  it('handles publish error', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/campaign/generate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', generated_text: "Test ad text" })
        });
      }
      if (url.includes('/api/campaign/publish')) {
        return Promise.reject(new Error("Publish failed"));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<CampaignDashboard />);
    const user = userEvent.setup();
    const promptInput = screen.getByPlaceholderText(/e.g., Promote our new summer silk collection.../i);
    await user.type(promptInput, "Test prompt");

    fireEvent.click(screen.getByText('✨ Generate AI Content'));

    await waitFor(() => {
      expect(screen.getByText(/Test ad text/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/Publish to Facebook|Publish to Meta/i));

    await waitFor(() => {
      expect(window.showNotification).toHaveBeenCalledWith('Error publishing campaign', 'error');
    });
  });
});
