import { BaseEntity } from './base.entity';
import { BaseResponseDto } from './base-response.dto';

export type TBaseMapperFormat = 'entity' | 'toDto' | 'toDtoWithRelations';

export abstract class BaseMapper<
  Entity extends BaseEntity,
  ResponseDto extends BaseResponseDto,
  ResponseDtoWithRelations extends BaseResponseDto,
> {
  protected fillDefaultFields(dto: ResponseDto, entity: Entity) {
    dto.id = entity.id;
    dto.createdAt = entity.createdAt; // TODO: format date
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  public transform(
    entity: Entity,
    format: TBaseMapperFormat,
  ): Entity | ResponseDto | ResponseDtoWithRelations {
    switch (format) {
      case 'toDto':
        return this.toDto(entity);
      case 'toDtoWithRelations':
        return this.toDtoWithRelations(entity);
      case 'entity':
        return entity;
      default:
        return entity;
    }
  }

  public abstract toDto(entity: Entity): ResponseDto;

  public abstract toDtoWithRelations(entity: Entity): ResponseDtoWithRelations;
}
