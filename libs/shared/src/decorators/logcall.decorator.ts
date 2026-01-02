/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Logger } from '@nestjs/common';

const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
};

function formatValue(value: any, depth = 0, seen = new Set<any>()): string {
  const indent = (level: number) => '  '.repeat(level);
  const pad = indent(depth);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'bigint') return value.toString() + 'n';
  if (value instanceof Date) return value.toISOString();

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return (
      '[\n' +
      value
        .map((item) => pad + '  ' + formatValue(item, depth + 1, seen))
        .join(',\n') +
      '\n' +
      pad +
      ']'
    );
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, any>);
    if (keys.length === 0) return '{}';

    const content = keys
      .map(
        (key) => `${pad}  ${key}: ${formatValue(value[key], depth + 1, seen)}`,
      )
      .join(',\n');

    return `{\n${content}\n${pad}}`;
  }

  return String(value); // fallback
}

export function logcall(skip_parameters = false): MethodDecorator {
  const logger = new Logger('logcall');

  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...arguments_: any[]) {
      const methodName = propertyKey.toString();
      const className = target.constructor?.name ?? 'UnknownClass';
      const context = `${className}.${methodName}`;
      const callId = getRandomInt(10000);

      if (skip_parameters) {
        logger.log(`\n[${callId}] CALL -> ${context} (parameters skipped)`);
      } else {
        logger.log(
          `\n[${callId}] CALL -> ${context} \n Arguments:\n${arguments_.map((argument, index) => `  Arg${index + 1}: ${formatValue(argument)}`).join('\n')}`,
        );
      }

      try {
        const result = originalMethod.apply(this, arguments_);

        if (result instanceof Promise) {
          return result
            .then((resolved) => {
              logger.log(
                `\n[${callId}] [Return] (async):\n${formatValue(resolved)}`,
              );
              logger.log(`\n[${callId}] [END] -> ${context}\n`);
              return resolved;
            })
            .catch((error) => {
              logger.error(
                `\n[${callId}] [Error (async)] in ${context}: ${error.message}`,
              );
              logger.error(`\n[${callId}] [Stack]:\n${error.stack}\n`);
              throw error;
            });
        } else {
          logger.log(`\n[${callId}] [Return]:\n${formatValue(result)}`);
          logger.log(`\n[${callId}] [END] -> ${context}\n`);
          return result;
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`\n[${callId}] [Error] in ${context}: ${error.message}`);
          logger.error(`\n[${callId}] [Stack]:\n${error.stack}\n`);
        } else {
          logger.error(`\n[${callId}] [Error] in ${context}: ${String(error)}`);
        }
        throw error;
      }
    };

    return descriptor;
  };
}
