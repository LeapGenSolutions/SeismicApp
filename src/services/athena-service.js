// Athena API configuration
const ATHENA_API_BASE_URL = process.env.REACT_APP_ATHENA_API_URL || 'https://api.athenahealth.com';
const ATHENA_CLIENT_ID = process.env.REACT_APP_ATHENA_CLIENT_ID;
const ATHENA_CLIENT_SECRET = process.env.REACT_APP_ATHENA_CLIENT_SECRET;
const ATHENA_REDIRECT_URI = process.env.REACT_APP_ATHENA_REDIRECT_URI;

// OAuth endpoints
const ATHENA_AUTH_URL = `${ATHENA_API_BASE_URL}/oauth/authorize`;
const ATHENA_TOKEN_URL = `${ATHENA_API_BASE_URL}/oauth/token`;

class AthenaService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  // Initialize OAuth flow
  initiateAuth() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: ATHENA_CLIENT_ID,
      redirect_uri: ATHENA_REDIRECT_URI,
      scope: 'athena/service/Athenanet.MDP.*',
    });

    window.location.href = `${ATHENA_AUTH_URL}?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(code) {
    try {
      const response = await fetch(ATHENA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: ATHENA_REDIRECT_URI,
          client_id: ATHENA_CLIENT_ID,
          client_secret: ATHENA_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.setTokens(data);
      return data;
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      throw error;
    }
  }

  // Set tokens and expiry
  setTokens({ access_token, refresh_token, expires_in }) {
    this.accessToken = access_token;
    this.refreshToken = refresh_token;
    this.tokenExpiry = Date.now() + (expires_in * 1000);
    
    // Store tokens securely (consider using a more secure storage method)
    localStorage.setItem('athena_access_token', access_token);
    localStorage.setItem('athena_refresh_token', refresh_token);
    localStorage.setItem('athena_token_expiry', this.tokenExpiry);
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const response = await fetch(ATHENA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: ATHENA_CLIENT_ID,
          client_secret: ATHENA_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.setTokens(data);
      return data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Check if token is valid and refresh if needed
  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
  }

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    await this.ensureValidToken();

    const response = await fetch(`${ATHENA_API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Athena API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get doctor's practice information
  async getPracticeInfo() {
    return this.makeRequest('/v1/practice');
  }

  // Get doctor's availability
  async getAvailability(doctorId, startDate, endDate) {
    const params = new URLSearchParams({
      providerid: doctorId,
      startdate: startDate,
      enddate: endDate,
    });

    return this.makeRequest(`/v1/appointments/available?${params.toString()}`);
  }

  // Get doctor's appointments
  async getAppointments(doctorId, startDate, endDate) {
    const params = new URLSearchParams({
      providerid: doctorId,
      startdate: startDate,
      enddate: endDate,
    });

    return this.makeRequest(`/v1/appointments?${params.toString()}`);
  }

  // Sync doctor's data with Seismic
  async syncDoctorData(doctorId) {
    const [practiceInfo, appointments] = await Promise.all([
      this.getPracticeInfo(),
      this.getAppointments(doctorId, new Date().toISOString(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // TODO: Implement data synchronization with Seismic's backend
    return {
      practiceInfo,
      appointments,
    };
  }
}

export const athenaService = new AthenaService(); 