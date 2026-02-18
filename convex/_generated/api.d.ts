/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as aiUsage from "../aiUsage.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as brandKits from "../brandKits.js";
import type * as credits from "../credits.js";
import type * as debug from "../debug.js";
import type * as generations from "../generations.js";
import type * as http from "../http.js";
import type * as organizations from "../organizations.js";
import type * as posterJobs from "../posterJobs.js";
import type * as posterTemplates from "../posterTemplates.js";
import type * as seed from "../seed.js";
import type * as seedCountryPricing from "../seedCountryPricing.js";
import type * as seedTemplates from "../seedTemplates.js";
import type * as showcase from "../showcase.js";
import type * as stripeAdmin from "../stripeAdmin.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  aiUsage: typeof aiUsage;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  billing: typeof billing;
  brandKits: typeof brandKits;
  credits: typeof credits;
  debug: typeof debug;
  generations: typeof generations;
  http: typeof http;
  organizations: typeof organizations;
  posterJobs: typeof posterJobs;
  posterTemplates: typeof posterTemplates;
  seed: typeof seed;
  seedCountryPricing: typeof seedCountryPricing;
  seedTemplates: typeof seedTemplates;
  showcase: typeof showcase;
  stripeAdmin: typeof stripeAdmin;
  templates: typeof templates;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
