import { Migration } from '@mikro-orm/migrations';

export class Migration20250415035335 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_collection" alter column "description" type text using ("description"::text);`);
    this.addSql(`alter table if exists "product_collection" alter column "description" drop not null;`);
    this.addSql(`alter table if exists "product_collection" alter column "is_active" type boolean using ("is_active"::boolean);`);
    this.addSql(`alter table if exists "product_collection" alter column "is_active" set default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_collection" alter column "description" type text using ("description"::text);`);
    this.addSql(`alter table if exists "product_collection" alter column "description" set not null;`);
    this.addSql(`alter table if exists "product_collection" alter column "is_active" drop default;`);
    this.addSql(`alter table if exists "product_collection" alter column "is_active" type boolean using ("is_active"::boolean);`);
  }

}
