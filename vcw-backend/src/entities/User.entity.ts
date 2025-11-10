import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Membership } from './Membership.entity';

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255, unique: true })
  email!: string;

  @Column('varchar', { length: 255 })
  password!: string;

  @Column('varchar', { length: 50, nullable: true })
  phone?: string;

  @Column('varchar', { length: 20, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended';

  @Column('varchar', { length: 255, nullable: true })
  walletDid?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Membership, membership => membership.user)
  memberships?: Membership[];
}
