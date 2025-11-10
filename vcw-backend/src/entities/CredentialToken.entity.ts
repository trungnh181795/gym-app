import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('credential_tokens')
export class CredentialToken {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { length: 255, unique: true })
  token!: string;

  @Column('varchar', { length: 36 })
  credentialId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column('datetime')
  expiresAt!: Date;

  @Column('boolean', { default: false })
  used!: boolean;
}
