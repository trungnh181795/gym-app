import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Service } from './Service.entity';

@Entity('benefits')
export class Benefit {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column('text', { nullable: true })
  serviceIds?: string; // JSON array string

  @Column('datetime')
  startDate!: Date;

  @Column('datetime')
  endDate!: Date;

  @Column('integer', { nullable: true })
  maxUsesPerMonth?: number;

  @Column('boolean', { default: false })
  requiresBooking!: boolean;

  @Column('boolean', { default: false })
  isShareable!: boolean;

  @Column('varchar', { length: 36, nullable: true })
  sharedWithUserId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
