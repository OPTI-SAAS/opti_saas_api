import { BaseEntity } from '@lib/shared/base';
import {
  ProductFrameGender,
  ProductPricingMode,
  ProductType,
} from '@lib/shared/enums';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { ClFile } from './files.client.entity';
import { ClVat } from './vats.client.entity';

@Entity('products')
export class ClProduct extends BaseEntity {
  // Base product columns
  @Column({ name: 'product_type', type: 'varchar' })
  productType!: ProductType;

  @Column({ name: 'designation', type: 'varchar' })
  designation!: string;

  @Column({ name: 'brand', type: 'varchar', nullable: true })
  brand?: string;

  @Column({ name: 'model', type: 'varchar', nullable: true })
  model?: string;

  @Column({
    name: 'family',
    type: 'varchar',
    nullable: true,
    array: true,
    default: () => "'{}'",
  })
  family?: string[];

  @Column({ name: 'color', type: 'varchar', nullable: true })
  color?: string;

  @Column({ name: 'external_referance', type: 'varchar', nullable: true })
  externalReferance?: string;

  @OneToOne(() => ClFile, { nullable: true })
  @JoinColumn({ name: 'main_picture_id' })
  mainPicture?: ClFile;

  // * Pricing columns *

  @Column({ name: 'pricing_mode', type: 'varchar' })
  pricingMode!: ProductPricingMode;

  @Column({
    name: 'coefficient',
    type: 'double precision',
    nullable: true,
  })
  coefficient?: number; // Used if pricingMode = 'coefficient'

  @Column({
    name: 'fixed_price',
    type: 'double precision',
    nullable: true,
  })
  fixedPrice?: number; // Used if pricingMode = 'fixed-price'

  @Column({
    name: 'fixed_added_amount',
    type: 'double precision',
    nullable: true,
  })
  fixedAddedAmount?: number; // Used if pricingMode = 'fixed-added-amount'

  @Column({ name: 'vat_id', type: 'uuid', nullable: true })
  vatId?: string;

  @ManyToOne(() => ClVat, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vat_id' })
  vat?: ClVat;

  @Column({ name: 'stock_quantity', type: 'int', nullable: true })
  minimumStockAlert?: number;

  // ! Frame-specific columns (productType = frame)

  @Column({ name: 'frame_gender', type: 'varchar', nullable: true })
  frameGender?: ProductFrameGender;

  @Column({ name: 'frame_shape', type: 'varchar', nullable: true })
  frameShape?: string;

  @Column({ name: 'frame_material', type: 'varchar', nullable: true })
  frameMaterial?: string;

  // type montage
  @Column({ name: 'frame_type', type: 'varchar', nullable: true })
  frameType?: string;

  // charniere
  @Column({ name: 'frame_hinge_type', type: 'varchar', nullable: true })
  frameHingeType?: string;

  // Calibre
  @Column({ name: 'frame_eye_size', type: 'int', nullable: true })
  frameEyeSize?: number;

  // pont
  @Column({ name: 'frame_bridge', type: 'int', nullable: true })
  frameBridge?: number;

  // branche
  @Column({ name: 'frame_temple', type: 'int', nullable: true })
  frameTemple?: number;

  // Finition
  @Column({ name: 'frame_finish', type: 'varchar', nullable: true })
  frameFinish?: string;

  // ! Lens-specific columns (productType = lens)
  @Column({ name: 'lens_type', type: 'varchar', nullable: true })
  lensType?: string;

  @Column({ name: 'lens_material', type: 'varchar', nullable: true })
  lensMaterial?: string;

  @Column({ name: 'lens_refractive_index', type: 'varchar', nullable: true })
  lensRefractiveIndex?: string;

  @Column({ name: 'lens_tint', type: 'varchar', nullable: true })
  lensTint?: string;

  @Column({
    name: 'lens_treatments',
    type: 'varchar',
    nullable: true,
    array: true,
    default: () => "'{}'",
  })
  lensTreatments?: string[];

  @Column({ name: 'lens_fabricant', type: 'varchar', nullable: true })
  lensFabricant?: string;

  // ! Contact lens-specific columns (productType = contact_lens)
  @Column({ name: 'contact_lens_type', type: 'varchar', nullable: true })
  contactLensType?: string;

  @Column({ name: 'contact_lens_usage', type: 'varchar', nullable: true })
  contactLensUsage?: string;

  @Column({ name: 'contact_lens_fabricant', type: 'varchar', nullable: true })
  contactLensFabricant?: string;

  @Column({
    name: 'contact_lens_base_curve',
    type: 'double precision',
    nullable: true,
  })
  contactLensBaseCurve?: number;

  @Column({
    name: 'contact_lens_diameter',
    type: 'double precision',
    nullable: true,
  })
  contactLensDiameter?: number;

  @Column({
    name: 'contact_lens_quantity_per_box',
    type: 'int',
    nullable: true,
  })
  contactLensQuantityPerBox?: number;

  // ! Clipon-specific columns (productType = clipon)

  @Column({ name: 'clipon_type', type: 'varchar', nullable: true })
  cliponType?: string;

  @Column({
    name: 'clipon_treatments',
    type: 'varchar',
    nullable: true,
    array: true,
    default: () => "'{}'",
  })
  cliponTreatments?: string[];

  @Column({ name: 'clipon_tint', type: 'varchar', nullable: true })
  cliponTint?: string;

  @Column({
    name: 'clipon_compatible_eye_size',
    type: 'varchar',
    nullable: true,
  })
  cliponCompatibleEyeSize?: string;

  // ! Accessory-specific columns (productType = accessory)
  // no specific columns for accessories yet
}
