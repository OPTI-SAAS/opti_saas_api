import { getBoSourceOptions, getClientSourceOptions } from '@lib/shared';
import { DataSourceOptions } from 'typeorm';

import { SchemaType } from './migration.types';

export const checkSchemaArgument = (argument: string): SchemaType => {
  if (['backoffice', 'client'].includes(argument)) {
    console.log(`Processing '${argument}' schema`);
    return argument as SchemaType;
  }
  console.log('Please choose schema type can only be (backoffice) or (client)');
  process.exit(1);
};

export const getSourceSchema = (schema_type: SchemaType): DataSourceOptions => {
  const sourceArguments =
    schema_type === 'backoffice'
      ? getBoSourceOptions()
      : getClientSourceOptions();
  console.log('--- Source Schema:', sourceArguments);
  return {
    ...sourceArguments,
  };
};
