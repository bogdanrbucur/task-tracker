-- CreateIndex
CREATE INDEX "Department_id_idx" ON "Department"("id");

-- CreateIndex
CREATE INDEX "Department_name_idx" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Status_id_idx" ON "Status"("id");

-- CreateIndex
CREATE INDEX "Status_displayName_idx" ON "Status"("displayName");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- CreateIndex
CREATE INDEX "User_firstName_idx" ON "User"("firstName");

-- CreateIndex
CREATE INDEX "User_lastName_idx" ON "User"("lastName");

-- CreateIndex
CREATE INDEX "User_managerId_idx" ON "User"("managerId");
