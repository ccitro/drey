-- CreateTable
CREATE TABLE "Override" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sensor" TEXT NOT NULL,
    "targetTemp" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "holdUntil" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Datastore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data_key" TEXT NOT NULL,
    "data_value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Override_sensor_key" ON "Override"("sensor");

-- CreateIndex
CREATE UNIQUE INDEX "Datastore_data_key_key" ON "Datastore"("data_key");
