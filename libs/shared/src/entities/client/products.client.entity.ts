import { BaseEntity } from '@lib/shared/base';
import { ProductStatus, ProductType } from '@lib/shared/enums';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { ClFile } from './files.client.entity';
import { ClVat } from './vats.client.entity';

@Entity('products')
export class ClProduct extends BaseEntity {
  // Base product columns
  @Column({ name: 'internal_code', type: 'varchar', unique: true })
  internalCode!: string;

  @Column({ name: 'barcode', type: 'varchar', nullable: true })
  barcode?: string;

  @Column({ name: 'product_type', type: 'varchar' })
  productType!: ProductType;

  @Column({ name: 'designation', type: 'varchar' })
  designation!: string;

  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId?: string;

  @Column({ name: 'model_id', type: 'uuid', nullable: true })
  modelId?: string;

  @Column({ name: 'color', type: 'varchar', nullable: true })
  color?: string;

  @Column({ name: 'supplier_reference', type: 'varchar', nullable: true })
  supplierReference?: string;

  @Column({ name: 'family_id', type: 'uuid', nullable: true })
  familyId?: string;

  @Column({ name: 'sub_family_id', type: 'uuid', nullable: true })
  subFamilyId?: string;

  @Column({ name: 'alert_threshold', type: 'int', default: 0 })
  alertThreshold!: number;

  @Column({ name: 'purchase_price_ht', type: 'double precision' })
  purchasePriceHT!: number;

  @Column({ name: 'coefficient', type: 'double precision', default: 1 })
  coefficient?: number;

  @Column({ name: 'vat_id', type: 'uuid', nullable: true })
  vatId?: string;

  @ManyToOne(() => ClVat, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vat_id' })
  vat?: ClVat;

  @Column({ name: 'status', type: 'varchar' })
  status!: ProductStatus;

  @Column({
    name: 'product_photo_id',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  productPhotoId?: string;

  @OneToOne(() => ClFile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_photo_id' })
  productPhoto?: ClFile;

  // Frame-specific columns (productType = frame)
  @Column({ name: 'frame_category', type: 'varchar', nullable: true })
  frameCategory?: string;

  @Column({ name: 'gender', type: 'varchar', nullable: true })
  framegender?: string;

  @Column({ name: 'shape', type: 'varchar', nullable: true })
  frameshape?: string;

  @Column({ name: 'material', type: 'varchar', nullable: true })
  framematerial?: string;

  @Column({ name: 'frame_type', type: 'varchar', nullable: true })
  frameType?: string;

  @Column({ name: 'hinge_type', type: 'varchar', nullable: true })
  frameHingeType?: string;

  @Column({ name: 'eye_size', type: 'int', nullable: true })
  frameEyeSize?: number;

  @Column({ name: 'bridge', type: 'int', nullable: true })
  frameBridge?: number;

  @Column({ name: 'temple', type: 'int', nullable: true })
  frameTemple?: number;

  @Column({ name: 'frame_color', type: 'varchar', nullable: true })
  frameColor?: string;

  @Column({ name: 'temple_color', type: 'varchar', nullable: true })
  frameTempleColor?: string;

  // Lens-specific columns (productType = lens)
  @Column({ name: 'lens_type', type: 'varchar', nullable: true })
  lensType?: string;

  @Column({ name: 'refractive_index', type: 'varchar', nullable: true })
  lensRefractiveIndex?: string;

  @Column({ name: 'tint', type: 'varchar', nullable: true })
  lensTint?: string;

  @Column({
    name: 'filters',
    type: 'varchar',
    array: true,
    default: () => "'{}'",
  })
  lensFilters!: string[];

  @Column({
    name: 'treatments',
    type: 'varchar',
    array: true,
    default: () => "'{}'",
  })
  lensTreatments!: string[];

  @Column({ name: 'sphere_power', type: 'double precision', nullable: true })
  lensSpherePower?: number;

  @Column({ name: 'cylinder_power', type: 'double precision', nullable: true })
  lensCylinderPower?: number;

  @Column({ name: 'axis', type: 'double precision', nullable: true })
  lensAxis?: number;

  @Column({ name: 'addition', type: 'double precision', nullable: true })
  lensAddition?: number;

  @Column({ name: 'diameter', type: 'double precision', nullable: true })
  lensDiameter?: number;

  @Column({ name: 'base_curve', type: 'double precision', nullable: true })
  lensBaseCurve?: number;

  @Column({ name: 'curvature', type: 'double precision', nullable: true })
  lensCurvature?: number;

  @Column({ name: 'optical_family', type: 'varchar', nullable: true })
  lensOpticalFamily?: string;

  // Contact lens-specific columns (productType = contact_lens)
  @Column({ name: 'contact_lens_type', type: 'varchar', nullable: true })
  contactLensType?: string;

  @Column({ name: 'usage', type: 'varchar', nullable: true })
  contactLensUsage?: string;

  @Column({ name: 'commercial_model', type: 'varchar', nullable: true })
  contactLensCommercialModel?: string;

  @Column({ name: 'cylinder', type: 'double precision', nullable: true })
  contactLensCylinder?: number;

  @Column({ name: 'batch_number', type: 'varchar', nullable: true })
  contactLensBatchNumber?: string;
}
