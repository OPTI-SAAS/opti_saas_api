import { BaseEntity } from '@lib/shared/base';
import { FileType } from '@lib/shared/enums';
import { Column, Entity } from 'typeorm';

@Entity('files')
export class ClFile extends BaseEntity {
  @Column({ name: 'key', type: 'varchar', unique: true })
  key!: string;

  @Column({ name: 'type', type: 'varchar' })
  type!: FileType;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType?: string;

  @Column({ name: 'size', type: 'int', nullable: true })
  size?: number;
}
