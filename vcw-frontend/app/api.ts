import type { ApiResponse, User, CreateUserRequest, Membership, CreateMembershipRequest, CredentialListItem, ShareResponse, CreateShareRequest, DashboardStats, MembershipTemplate, GymBusinessInfo, IssuerInfo, StoredCredential, CreateCredentialResponse, VerificationResult, PublicKeyInfo, ShareDetail } from './types';
import type { DIDDocument } from './services/verification.service';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:3000';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data.data as T;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // User API methods
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/api/users/${id}`);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: Partial<CreateUserRequest>): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/api/users?search=${encodeURIComponent(query)}`);
  }

  // Membership API methods
  async getMemberships(): Promise<Membership[]> {
    return this.request<Membership[]>('/api/memberships');
  }

  async getMembershipById(id: string): Promise<Membership> {
    return this.request<Membership>(`/api/memberships/${id}`);
  }

  async getMembershipsByUserId(userId: string): Promise<Membership[]> {
    return this.request<Membership[]>(`/api/memberships?userId=${userId}`);
  }

  async createMembership(membershipData: CreateMembershipRequest): Promise<Membership> {
    return this.request<Membership>('/api/memberships', {
      method: 'POST',
      body: JSON.stringify(membershipData),
    });
  }

  async updateMembership(id: string, membershipData: Partial<CreateMembershipRequest>): Promise<Membership> {
    return this.request<Membership>(`/api/memberships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(membershipData),
    });
  }

  async deleteMembership(id: string): Promise<void> {
    return this.request<void>(`/api/memberships/${id}`, {
      method: 'DELETE',
    });
  }

  async getMembershipTemplates(): Promise<MembershipTemplate[]> {
    return this.request<MembershipTemplate[]>('/api/memberships/templates/list');
  }

  // Credentials API methods
  async getCredentials(): Promise<CredentialListItem[]> {
    return this.request<{ credentials: CredentialListItem[] }>('/api/credentials')
      .then(data => data.credentials);
  }

  async getCredentialById(id: string): Promise<StoredCredential> {
    return this.request<StoredCredential>(`/api/credentials/${id}`);
  }

  async getCredentialJwt(id: string): Promise<{ jwt: string }> {
    const credential = await this.getCredentialById(id);
    return { jwt: credential.jwt };
  }

  async createCredential(credentialData: { holderDid: string; name: string; plan: string; benefitType?: string; membershipId?: string }): Promise<CreateCredentialResponse> {
    return this.request<CreateCredentialResponse>('/api/credentials/issue', {
      method: 'POST',
      body: JSON.stringify(credentialData),
    });
  }

  async deleteCredential(id: string): Promise<void> {
    return this.request<void>(`/api/credentials/${id}`, {
      method: 'DELETE',
    });
  }

  async revokeCredential(id: string, reason?: string): Promise<void> {
    return this.request<void>(`/api/credentials/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async verifyCredential(jwt: string): Promise<VerificationResult> {
    return this.request<VerificationResult>('/api/credentials/verify', {
      method: 'POST',
      body: JSON.stringify({ jwt }),
    });
  }

  // Sharing API methods
  async createShare(shareData: CreateShareRequest): Promise<ShareResponse> {
    return this.request<ShareResponse>('/api/shares', {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
  }

  async getSharedCredential(shareId: string): Promise<ShareDetail> {
    return this.request<ShareDetail>(`/api/shares/${shareId}`);
  }

  async revokeShare(shareId: string): Promise<void> {
    return this.request<void>(`/api/shares/${shareId}`, {
      method: 'DELETE',
    });
  }

  async getSharesByCredentialId(credentialId: string): Promise<ShareDetail[]> {
    return this.request<ShareDetail[]>(`/api/shares/credential/${credentialId}`);
  }

  // Dashboard API methods
  async getDashboardStats(): Promise<DashboardStats> {
    const [userStats, membershipStats, credentialStats, shareStats] = await Promise.all([
      this.request<DashboardStats['users']>('/api/users/stats/overview'),
      this.request<DashboardStats['memberships']>('/api/memberships/stats/overview'),
      this.request<DashboardStats['credentials']>('/api/credentials/admin/stats'),
      this.request<DashboardStats['shares']>('/api/shares/stats/overview'),
    ]);

    return {
      users: userStats,
      memberships: membershipStats,
      credentials: credentialStats,
      shares: shareStats,
    };
  }

  // Issuer API methods
  async getGymInfo(): Promise<GymBusinessInfo> {
    return this.request<GymBusinessInfo>('/api/issuer/info');
  }

  async getIssuerDid(): Promise<{ did: string }> {
    return this.request<{ did: string }>('/api/issuer/did');
  }

  async getDIDDocument(): Promise<DIDDocument> {
    return this.request<DIDDocument>('/api/issuer');
  }

  async getPublicKey(): Promise<PublicKeyInfo> {
    return this.request<PublicKeyInfo>('/api/issuer/public-key');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;