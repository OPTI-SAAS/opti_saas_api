import { DeepPartial } from 'typeorm';

import { PaginationQueryDto } from '../dto';
import { TPaginatedData } from '../types';

export interface IBaseCRUDController<
  Entity extends { id: string; deletedAt: Date },
  CreateDto extends DeepPartial<Entity>,
  UpdateDto extends DeepPartial<Entity>,
> {
  findAll<TQuery extends PaginationQueryDto>(
    query: TQuery,
  ): Promise<TPaginatedData<Entity>>;
  findOne(id: string): Promise<Entity>;
  create(dto: CreateDto): Promise<Entity>;
  update(id: string, dto: UpdateDto): Promise<Entity>;
  delete?(id: string): Promise<{ message: string }>;
  softDelete?(id: string): Promise<{ message: string }>;
  restore?(id: string): Promise<Entity>;
}
