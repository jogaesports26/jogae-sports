-- CreateTable
CREATE TABLE "_EquipmentCourts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipmentCourts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EquipmentCourts_B_index" ON "_EquipmentCourts"("B");

-- AddForeignKey
ALTER TABLE "_EquipmentCourts" ADD CONSTRAINT "_EquipmentCourts_A_fkey" FOREIGN KEY ("A") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentCourts" ADD CONSTRAINT "_EquipmentCourts_B_fkey" FOREIGN KEY ("B") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
