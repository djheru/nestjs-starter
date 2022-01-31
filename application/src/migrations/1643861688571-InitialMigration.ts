import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1643861688571 implements MigrationInterface {
    name = 'InitialMigration1643861688571'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tagName" character varying NOT NULL, CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_334b5e2238470c6f0f124e60cc" ON "tag" ("tagName") `);
        await queryRunner.query(`CREATE TABLE "todo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying NOT NULL, "isCompleted" boolean NOT NULL, "dueDate" character varying, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "noteId" uuid, CONSTRAINT "PK_d429b7114371f6a35c5cb4776a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "details" character varying, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, CONSTRAINT "PK_96d0c172a4fba276b1bbed43058" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note_tags_tag" ("noteId" uuid NOT NULL, "tagId" uuid NOT NULL, CONSTRAINT "PK_2b984c7d3fe402800e2c3830740" PRIMARY KEY ("noteId", "tagId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6e5b1c3234803e65ef062812cf" ON "note_tags_tag" ("noteId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8aa86b09c799e40c8273f07d8f" ON "note_tags_tag" ("tagId") `);
        await queryRunner.query(`ALTER TABLE "todo" ADD CONSTRAINT "FK_8a1f8e09cc510e654c7293f2537" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_tags_tag" ADD CONSTRAINT "FK_6e5b1c3234803e65ef062812cf6" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note_tags_tag" ADD CONSTRAINT "FK_8aa86b09c799e40c8273f07d8fc" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_tags_tag" DROP CONSTRAINT "FK_8aa86b09c799e40c8273f07d8fc"`);
        await queryRunner.query(`ALTER TABLE "note_tags_tag" DROP CONSTRAINT "FK_6e5b1c3234803e65ef062812cf6"`);
        await queryRunner.query(`ALTER TABLE "todo" DROP CONSTRAINT "FK_8a1f8e09cc510e654c7293f2537"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8aa86b09c799e40c8273f07d8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e5b1c3234803e65ef062812cf"`);
        await queryRunner.query(`DROP TABLE "note_tags_tag"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`DROP TABLE "todo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_334b5e2238470c6f0f124e60cc"`);
        await queryRunner.query(`DROP TABLE "tag"`);
    }

}
