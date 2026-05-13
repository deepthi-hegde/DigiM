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
  });

  it('renders correctly', () => {
    render(<Platforms />);
    expect(screen.getByText('Connect Platforms')).toBeTruthy();
    expect(screen.getByText('Facebook Page')).toBeTruthy();
    expect(screen.getByText('Instagram Business')).toBeTruthy();
  });

  it('handles FB.login missing (out of bounds)', async () => {
    // Override alert to prevent console noise
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<Platforms />);
    const connectFbButton = screen.getAllByText('Connect', { selector: 'button', exact: false })[0];
    fireEvent.click(connectFbButton);
    
    expect(alertMock).toHaveBeenCalledWith('Facebook SDK is still loading. Please try again in a moment.');
    alertMock.mockRestore();
  });

  it('handles FB login success', async () => {
    (window as any).FB = {
      init: jest.fn(),
      _initialized: true,
      login: jest.fn().mockImplementation((cb) => {
        cb({ authResponse: { accessToken: "test_token" } });
      })
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<Platforms />);
    const connectFbButton = screen.getAllByText('Connect', { selector: 'button' })[0];
    
    fireEvent.click(connectFbButton); // First connect button is Facebook

    await waitFor(() => {
      expect(screen.getByText('✓ Connected')).toBeTruthy();
      expect(screen.getByText('Connected as MarketFlow Silks')).toBeTruthy();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/meta/connect", expect.objectContaining({
      method: "POST"
    }));
  });
});

describe('CampaignDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<CampaignDashboard />);
    expect(screen.getByText('Campaign Setup')).toBeTruthy();
    expect(screen.getByText('Fully AI-Managed Posting')).toBeTruthy();
  });

  it('generates campaign text correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ generated_text: "Here is your awesome ad!" })
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
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Create a new mock specifically for this test
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("API Error"));

    render(<CampaignDashboard />);
    
    const generateButton = screen.getByText('✨ Generate AI Content');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error generating campaign');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('publishes generated campaign correctly', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    // First, simulate generating the campaign
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ generated_text: "Here is your awesome ad!" })
    });

    render(<CampaignDashboard />);
    fireEvent.click(screen.getByText('✨ Generate AI Content'));

    await waitFor(() => {
      expect(screen.getByText(/Here is your awesome ad!/i)).toBeTruthy();
    });

    // Now simulate publishing
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Published successfully!" })
    });

    const publishButton = screen.getByText('Approve & Publish to Meta');
    fireEvent.click(publishButton);

    expect(screen.getByText('Publishing...')).toBeTruthy();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Published successfully! Published successfully!');
    });
    alertSpy.mockRestore();
  });

  it('handles publish error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Generate campaign
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ generated_text: "Test ad text" })
    });

    render(<CampaignDashboard />);
    fireEvent.click(screen.getByText('✨ Generate AI Content'));

    await waitFor(() => {
      expect(screen.getByText(/Test ad text/i)).toBeTruthy();
    });

    // Simulate publish failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Publish failed"));

    fireEvent.click(screen.getByText('Approve & Publish to Meta'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error publishing campaign');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
