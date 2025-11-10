import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('credentials')
export class StoredCredential {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('text')
  credential!: string; // JSON string of W3C VC

  @Column('text')
  jwt!: string;

  @Column('varchar', { length: 255 })
  holderDid!: string;

  @Column('varchar', { length: 36, nullable: true })
  benefitId?: string;

  @Column('varchar', { length: 36, nullable: true })
  membershipId?: string;

  @Column('varchar', { length: 20, default: 'active' })
  status!: 'active' | 'revoked' | 'expired';

  @Column('datetime', { nullable: true })
  expireDate?: Date;

  @Column('text', { nullable: true })
  metadata?: string; // JSON string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
