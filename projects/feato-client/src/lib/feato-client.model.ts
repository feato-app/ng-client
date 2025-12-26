/**
 * Supported application environments.
 *
 * Used to scope feature flags and events to a specific deployment context.
 */
export type Environment = 'prod' | 'dev' | 'stage' | 'qa' | 'preview';

/**
 * Feato client configuration.
 *
 * Used by the provider/service to initialize the SDK and define the context
 * in which events are sent and requests are executed.
 */
export interface FeatoClientConfig {
  /**
   * Project key (public identifier) issued by Feato.
   * Typically provided as a string without spaces.
   */
  projectKey: string;

  /**
   * Application environment.
   *
   * Examples: `prod`, `dev`, `stage`, `qa`, `preview`.
   */
  environment: Environment;
}

/**
 * Feature flag change event.
 *
 * Represents a single flag update with its current value and the time it was updated.
 */
export interface FeatureFlagEvent {
  /** Feature flag key. */
  key: string;

  /** Feature flag value. */
  value: boolean;

  /** Timestamp when the value was last updated. */
  updatedAt: Date;
}

/**
 * Feature flags snapshot response.
 */
export interface FeatureFlagsResponse {
  /** The environment this flags snapshot belongs to. */
  environment: Environment;

  /** Map of `flagKey -> enabled`. */
  flags: Record<string, boolean>;
}
