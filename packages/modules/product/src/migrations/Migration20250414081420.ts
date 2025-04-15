import { Migration } from '@mikro-orm/migrations';

export class Migration20250414081420 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product" add column if not exists "long_description" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product" drop column if exists "long_description";`);
  }

}
