import { Command, CommandSchema } from '../Components/Commands/Command';
import { Job } from '../Components/Job';
import { JobSchema } from '../Components/Job/index';
import { Workflow } from '../Components/Workflow';
import { WorkflowSchema } from '../Components/Workflow/Workflow';
import { AbstractExecutor } from '../Components/Executor/Executor';
import { Pipeline } from './Pipeline';
import { stringify as Stringify } from 'yaml';
import { ExecutorSchema } from '../Components/Executor/Executor.types';

/**
 * A CircleCI configuration. Instantiate a new config and add CircleCI config elements.
 */
export class Config implements CircleCIConfigObject {
  /**
   * The version field is intended to be used in order to issue warnings for deprecation or breaking changes.
   */
  version: ConfigVersion = 2.1;
  /**
   * Executors define the environment in which the steps of a job will be run, allowing you to reuse a single executor definition across multiple jobs.
   */
  executors: AbstractExecutor[] = [];
  /**
   * Jobs are collections of steps. All of the steps in the job are executed in a single unit, either within a fresh container or VM.
   */
  jobs: Job[] = [];
  /**
   * A command definition defines a sequence of steps as a map to be executed in a job, enabling you to reuse a single command definition across multiple jobs.
   */
  commands: Command[] = [];
  /**
   * A Workflow is comprised of one or more uniquely named jobs.
   */
  workflows: Workflow[] = [];
  /**
   * Access information about the current pipeline.
   */
  pipeline: Pipeline = new Pipeline();
  /**
   * Designates the config.yaml for use of CircleCI’s dynamic configuration feature.
   */
  setup: boolean;
  /**
   * Instantiate a new CircleCI config. Build up your config by adding components.
   * @param jobs - Instantiate with pre-defined Jobs.
   * @param workflows - Instantiate with pre-defined Workflows.
   * @param executors - Instantiate with pre-defined reusable Executors.
   * @param commands - Instantiate with pre-defined reusable Commands.
   */
  constructor(
    setup = false,
    jobs?: Job[],
    workflows?: Workflow[],
    executors?: AbstractExecutor[],
    commands?: Command[],
  ) {
    this.setup = setup;
    this.jobs.concat(jobs || []);
    this.workflows.concat(workflows || []);
    this.executors = executors || [];
    this.commands = commands || [];
  }

  /**
   * Add a Workflow to the current Config. Chainable
   * @param workflow - Injectable Workflow
   */
  addWorkflow(workflow: Workflow): this {
    this.workflows.push(workflow);
    return this;
  }
  /**
   * Add an Executor to the current Config. Chainable
   * @param executor - Injectable executor
   */
  addExecutor(executor: AbstractExecutor): this {
    this.executors.push(executor);
    return this;
  }
  /**
   * Add a Job to the current Config. Chainable
   * @param job - Injectable Job
   */
  addJob(job: Job): this {
    // Abstract rules later
    if (this.executors.find((x) => x.name == job.executor.name)) {
      this.jobs.push(job);
    } else {
      throw new Error(
        'The selected executor has not yet been added to the config file. Make sure you have first called addExecutor.',
      );
    }
    return this;
  }

  /**
   * Export the CircleCI configuration as a YAML string.
   */
  stringify(): string {
    const generatedExecutorConfig: ExecutorSchema = {};
    this.executors.forEach((executor) => {
      Object.assign(generatedExecutorConfig, executor.generate());
    });

    const generatedJobConfig: JobSchema = {};
    this.jobs.forEach((job) => {
      Object.assign(generatedJobConfig, job.generate());
    });

    const generatedWorkflowConfig: WorkflowSchema = {};
    this.workflows.forEach((workflow) => {
      Object.assign(generatedWorkflowConfig, workflow.generate());
    });

    const generatedConfig: CircleCIConfigSchema = {
      version: this.version,
      setup: this.setup,
      executors: generatedExecutorConfig,
      jobs: generatedJobConfig,
      workflows: generatedWorkflowConfig,
    };
    return Stringify(generatedConfig);
  }
}

export type ConfigVersion = 2 | 2.1;
export interface ConfigOrbImport {
  orbAlias: string;
  orbImport: string;
}

export interface CircleCIConfigObject {
  version: ConfigVersion;
  jobs?: Job[];
  executors?: AbstractExecutor[];
  commands?: Command[];
  workflows?: Workflow[];
}

export interface CircleCIConfigSchema {
  version: ConfigVersion;
  setup: boolean;
  orbs?: ConfigOrbImport[];
  jobs: JobSchema;
  executors?: ExecutorSchema;
  commands?: CommandSchema;
  workflows: WorkflowSchema;
}
