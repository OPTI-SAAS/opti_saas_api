import { ExtractEnumTypes } from '@lib/shared/helpers';

export const BoClinicStatus = {
  Draft: 'draft', // Not yet activated
  Pending: 'pending', // Not yet activated
  Running: 'running', // Active
  Stopped: 'stopped', // Deactivated
  Failed: 'failed', // Activation failed
} as const;
export type TBoClinicStatus = ExtractEnumTypes<typeof BoClinicStatus>;

/*
 * Clinic stages for Backoffice
 * These stages represent the lifecycle of a clinic in the backoffice system.
 * They are used to track the progress of clinic setup and initialization.
 *
 * - ReadyForInitialization: Clinic has been created in backoffice DB and ready for schema creation
 * - InitalizationFailed: Clinic initialization failed, likely due to schema creation issues
 * - ReadyForSetuping: Clinic schema created, ready for setup (migrations)
 * - SetupingFailed: Clinic setup failed, likely due to migration issues
 * - ReadyForSeeding: Clinic setup completed, ready for seeding (initial data)
 * - SeedingFailed: Clinic seeding failed, likely due to data insertion issues
 * - Running: Clinic is fully set up and running, ready for use
 */
export const BoClinicStage = {
  ReadyForInitialization: 'ready_for_initialization', // Migration initiated
  InitalizationFailed: 'initialization_failed', // Initialization failed
  ReadyForSetuping: 'ready_for_setuping', // Ready for setup
  SetupingFailed: 'setup_failed', // Setup failed
  ReadyForSeeding: 'ready_for_seeding', // Ready for seeding
  SeedingFailed: 'seeding_failed', // Seeding failed
  Running: 'running', // Clinic is fully set up and running
} as const;
export type TBoClinicStage = ExtractEnumTypes<typeof BoClinicStage>;
