import Configstore from 'configstore';
import type { Session } from '../types/mcp.js';

const CONFIG_KEY = 'tunnelhub-mcp';

export class TokenManager {
  private config: Configstore;

  constructor() {
    this.config = new Configstore(CONFIG_KEY, {
      sessions: {},
      currentSession: null
    });
  }

  /**
   * Get all sessions
   */
  getAllSessions(): Record<string, Session> {
    return (this.config.get('sessions') as Record<string, Session> | undefined) || {};
  }

  /**
   * Get a specific session
   */
  getSession(sessionId: string): Session | null {
    const sessions = this.getAllSessions();
    return sessions[sessionId] || null;
  }

  /**
   * Save or update a session
   */
  saveSession(session: Session): void {
    const sessions = this.getAllSessions();
    sessions[session.id] = {
      ...session,
      lastUsed: new Date().toISOString()
    };
    this.config.set('sessions', sessions);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions();
    delete sessions[sessionId];
    this.config.set('sessions', sessions);

    // If this was the current session, clear it
    if (this.getCurrentSessionId() === sessionId) {
      this.setCurrentSessionId(null);
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return (this.config.get('currentSession') as string | null | undefined) || null;
  }

  /**
   * Set current session ID
   */
  setCurrentSessionId(sessionId: string | null): void {
    this.config.set('currentSession', sessionId);
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    const sessionId = this.getCurrentSessionId();
    if (!sessionId) return null;
    return this.getSession(sessionId);
  }

  /**
   * Update session tokens
   */
  updateSessionTokens(sessionId: string, tokens: Session['tokens']): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.tokens = tokens;
    session.lastUsed = new Date().toISOString();
    this.saveSession(session);
  }

  /**
   * Check if token is expired or expiring soon
   */
  isTokenExpiring(session: Session, bufferMinutes = 5): boolean {
    const now = Date.now();
    const expiresAt = session.tokens.expiresAt;
    const bufferMs = bufferMinutes * 60 * 1000;
    
    return now >= (expiresAt - bufferMs);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.config.set('sessions', {});
    this.config.set('currentSession', null);
  }

  /**
   * Get sessions sorted by last used
   */
  getSessionsSortedByLastUsed(): Session[] {
    const sessions = Object.values(this.getAllSessions());
    return sessions.sort((a, b) => {
      const dateA = new Date(a.lastUsed).getTime();
      const dateB = new Date(b.lastUsed).getTime();
      return dateB - dateA;
    });
  }
}
