import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';

@Entity('memberships')
export class Membership {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { length: 36 })
  userId!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text')
  description!: string;

  @Column('varchar', { length: 20, default: 'active' })
  status!: 'active' | 'expired' | 'suspended' | 'cancelled';

  @Column('datetime')
  validFrom!: Date;

  @Column('datetime')
  validUntil!: Date;

  @Column('text', { nullable: true })
  benefitIds?: string; // JSON array string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.memberships)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
