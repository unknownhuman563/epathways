import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Free Assessment Form - Full 12-step walkthrough
 *
 * Prerequisites:
 *   1. php artisan serve (running on localhost:8000)
 *   2. npm run dev (Vite dev server)
 *   3. php artisan migrate (DB up to date)
 *
 * Run: npx playwright test e2e/free-assessment.spec.ts
 */

// Helper: find input within a Field component by its label text
function field(parent: Locator, labelText: string) {
  return parent.locator(`div.space-y-3:has(label:text("${labelText}"))`);
}

function fieldInput(parent: Locator, labelText: string) {
  return field(parent, labelText).locator('input, select, textarea').first();
}

// Helper: click Next Sequence and wait for animation
async function nextStep(page: Page) {
  await page.getByRole('button', { name: 'Next Sequence' }).click();
  await page.waitForTimeout(500);
}

// Helper: click Yes or No within a Field
async function toggleField(parent: Locator, labelText: string, value: 'Yes' | 'No') {
  await field(parent, labelText).getByRole('button', { name: value, exact: true }).click();
  await parent.page().waitForTimeout(300);
}

test.describe('Free Assessment Form', () => {
  test('complete all 12 steps and submit', async ({ page }) => {
    await page.goto('/free-assessment');
    await expect(page.getByRole('heading', { name: /enrolment eligibility/i })).toBeVisible();

    // ── Step 1: Terms ──
    await page.locator('input[type="checkbox"]').check();
    await nextStep(page);

    // ── Step 2: Personal Information ──
    await expect(page.getByRole('heading', { name: 'Personal Profile' })).toBeVisible();
    const step2 = page.locator('form');

    await fieldInput(step2, 'First Name').fill('Juan');
    await fieldInput(step2, 'Surname').fill('Dela Cruz');

    // Other names - Yes
    await toggleField(step2, 'Have you ever used any other names', 'Yes');
    await fieldInput(step2, 'Full Other Name').fill('Johnny Cruz');

    await fieldInput(step2, 'Gender').selectOption('Male');
    await fieldInput(step2, 'Marital Status').selectOption('Single');
    await fieldInput(step2, 'Phone Number').fill('+639171234567');
    await fieldInput(step2, 'Email Address').fill('juan@test.com');
    await fieldInput(step2, 'Date of Birth').fill('1995-06-15');
    await fieldInput(step2, 'Country of Birth').fill('Philippines');
    await fieldInput(step2, 'Place of Birth').fill('Manila');
    await fieldInput(step2, 'Citizenship').fill('Filipino');

    // Current Residence
    const residence = step2.locator('h3:has-text("Current Residence")').locator('..');
    await fieldInput(residence, 'City').fill('Makati');
    await fieldInput(residence, 'State').fill('Metro Manila');
    await fieldInput(residence, 'Country').fill('Philippines');

    // Passport - Yes
    await toggleField(step2, 'Do you have a valid passport', 'Yes');
    await fieldInput(step2, 'Passport Number').fill('P1234567A');
    await fieldInput(step2, 'Expiry Date').fill('2030-12-31');

    await nextStep(page);

    // ── Step 3: Study Plans ──
    await expect(page.getByRole('heading', { name: 'Study Aspirations' })).toBeVisible();
    const step3 = page.locator('form');

    await fieldInput(step3, 'Preferred Course').fill('Bachelor of IT');
    await fieldInput(step3, 'Qualification Level').selectOption('Bachelor Degree (Level 7)');
    await fieldInput(step3, 'Preferred City').fill('Auckland');
    await fieldInput(step3, 'Preferred Intake').fill('Feb 2027');

    // English test - Yes
    await toggleField(step3, 'Have you taken an English test', 'Yes');
    await fieldInput(step3, 'Test Type').selectOption('IELTS Academic');
    await fieldInput(step3, 'Overall').fill('7.0');
    await fieldInput(step3, 'Reading').fill('7.5');
    await fieldInput(step3, 'Writing').fill('6.5');
    await fieldInput(step3, 'Listening').fill('7.0');
    await fieldInput(step3, 'Speaking').fill('7.0');
    await fieldInput(step3, 'Test Date').fill('2026-01-15');

    await nextStep(page);

    // ── Step 4: Education Background ──
    await expect(page.getByRole('heading', { name: 'Academic Background' })).toBeVisible();
    const step4 = page.locator('form');

    // High school - Yes
    await toggleField(step4, 'Have you completed high school', 'Yes');
    await fieldInput(step4, 'Highest Level Completed').selectOption('12th');

    // High school institution is inside the HS card
    const hsCard = step4.locator('h3:has-text("High School")').locator('..');
    await fieldInput(hsCard, 'Name of Institution').fill('Manila Science HS');
    await fieldInput(hsCard, 'Start Date').fill('2008-06-01');
    await fieldInput(hsCard, 'End Date').fill('2012-03-31');
    await fieldInput(hsCard, 'Average Marks').fill('92%');

    // Expand Bachelor's Degree card (click the checkbox row)
    const bachelorsCard = step4.locator('span:has-text("Bachelor\'s Degree")').locator('..').locator('..');
    await bachelorsCard.click();
    await page.waitForTimeout(400);

    // Fill Bachelor's fields
    const bachelorsExpanded = bachelorsCard.locator('..');
    await fieldInput(bachelorsExpanded, 'Field of Study').fill('Computer Science');
    await fieldInput(bachelorsExpanded, 'Name of Institution').fill('University of the Philippines');
    await fieldInput(bachelorsExpanded, 'Start Date').fill('2012-06-01');
    await fieldInput(bachelorsExpanded, 'End Date').fill('2016-04-30');
    await fieldInput(bachelorsExpanded, 'Average Marks').fill('1.5 GWA');

    // Document checkboxes
    await step4.locator('label:has-text("12th Certificate")').click();
    await step4.locator("label:has-text(\"Bachelor's Certificate\")").click();
    await step4.locator('label:has-text("Academic Transcripts")').click();

    // Gap - Yes
    await toggleField(step4, 'Has there been a gap', 'Yes');
    await fieldInput(step4, 'How long was the gap').fill('2 years');
    await step4.locator('button:has-text("Working")').click();
    await fieldInput(step4, 'Please explain further').fill('Worked as a developer to gain experience.');

    await nextStep(page);

    // ── Step 5: Work Experience ──
    await expect(page.getByRole('heading', { name: 'Professional History' })).toBeVisible();
    const step5 = page.locator('form');

    await fieldInput(step5, 'Current Company').fill('TechCorp Philippines');
    await fieldInput(step5, 'Job Title').fill('Software Developer');
    await fieldInput(step5, 'Start Date').fill('2016-07-01');

    // Still working - No
    await toggleField(step5, 'Still working here', 'No');
    await fieldInput(step5, 'End Date').fill('2026-03-31');

    await fieldInput(step5, 'Key Responsibilities').fill('Full-stack development with Laravel and React.');

    // Supporting docs - Yes
    await toggleField(step5, 'Can you provide supporting documents', 'Yes');
    await step5.locator('label:has-text("Certificate of Employment")').click();
    await step5.locator('label:has-text("Salary slips")').click();

    await nextStep(page);

    // ── Step 6: Financial ──
    await expect(page.getByRole('heading', { name: 'Financial Capability' })).toBeVisible();
    const step6 = page.locator('form');

    await toggleField(step6, 'Do you have enough funds', 'Yes');
    await toggleField(step6, 'Do you have NZ', 'Yes');

    await step6.locator('button:has-text("Personal Savings")').click();
    await step6.locator('button:has-text("Family Support")').click();

    await fieldInput(step6, 'Estimated Available Funds').fill('3,000,000 PHP');

    await toggleField(step6, 'Do you have financial sponsors', 'Yes');
    await fieldInput(step6, 'Relation to Sponsor').fill('Parents');

    await nextStep(page);

    // ── Step 7: Source of Funds & Sponsors ──
    await expect(page.getByRole('heading', { name: /Source of Funds/i })).toBeVisible();
    const step7 = page.locator('form');

    await step7.locator('button:has-text("Family savings")').click();
    await step7.locator('button:has-text("Personal savings")').click();

    await toggleField(step7, 'Will you fund your studies', 'No');

    // Student docs
    await step7.locator('label:has-text("Bank statements (6 months)")').click();

    // Use sponsor - Yes
    await toggleField(step7, 'Will you be using someone to sponsor', 'Yes');

    // Sponsor details
    await fieldInput(step7, 'Relation to Sponsor').selectOption('Both parents');
    await toggleField(step7, 'Is the sponsor NZ based', 'No');
    await toggleField(step7, 'Is the sponsor an NZ resident', 'No');

    await fieldInput(step7, 'Sponsor Occupation').fill('Business Owner');
    await fieldInput(step7, 'Employer / Business Name').fill('Cruz Trading Co.');
    await fieldInput(step7, 'Estimated Annual Income').fill('NZ$120,000');

    // Sponsor fund sources
    await step7.locator('button:has-text("Savings")').first().click();

    // Sponsor financial docs
    await step7.locator('h5:has-text("Sponsor Financial")').locator('..').locator('label:has-text("Bank statements")').click();
    await step7.locator('h5:has-text("Sponsor Financial")').locator('..').locator('label:has-text("Income Tax Return")').click();

    // Sponsor identity docs
    await step7.locator('h5:has-text("identity documents")').locator('..').locator('label:has-text("Passport")').click();

    await nextStep(page);

    // ── Step 8: Immigration / Travel History ──
    await expect(page.getByRole('heading', { name: 'Immigration / Travel History' })).toBeVisible();
    const step8 = page.locator('form');

    await toggleField(step8, 'Have you previously travelled overseas', 'Yes');
    await step8.locator('textarea').first().fill('Japan, Tourist Visa, Approved, Dec 2024 - Jan 2025');

    await toggleField(step8, 'Have you ever applied for a visa to New Zealand', 'No');
    await toggleField(step8, 'Will your total time in New Zealand', 'No');
    await toggleField(step8, 'Have you ever applied for a visa to another', 'No');
    await toggleField(step8, 'Have you ever had a visa refusal', 'No');

    await fieldInput(step8, 'What country will you be in').fill('Philippines');

    await nextStep(page);

    // ── Step 9: Character & Health ──
    await expect(page.getByRole('heading', { name: /Character & Health/i })).toBeVisible();
    const step9 = page.locator('form');

    // Character - all No
    await toggleField(step9, 'convicted', 'No');
    await toggleField(step9, 'under investigation', 'No');
    await toggleField(step9, 'expelled, deported', 'No');
    await toggleField(step9, 'refused a visa', 'No');
    await toggleField(step9, 'lived in any country for 5', 'No');

    // Health - all No
    await toggleField(step9, 'tuberculosis', 'No');
    await toggleField(step9, 'renal dialysis', 'No');
    await toggleField(step9, 'hospital care', 'No');
    await toggleField(step9, 'residential care', 'No');
    await toggleField(step9, 'pregnant', 'No');

    await nextStep(page);

    // ── Step 10: Family Information ──
    await expect(page.getByRole('heading', { name: /Family Information/i })).toBeVisible();
    const step10 = page.locator('form');

    // Expand Father card
    await step10.locator('span:has-text("Father")').click();
    await page.waitForTimeout(400);
    const fatherCard = step10.locator('div.rounded-2xl:has(span:has-text("Father"))');
    await fieldInput(fatherCard, 'First Name').fill('Pedro');
    await fieldInput(fatherCard, 'Family Name').fill('Dela Cruz');
    await fieldInput(fatherCard, 'Date of Birth').fill('1965-03-10');
    await fieldInput(fatherCard, 'Partnership Status').selectOption('Married');
    await fieldInput(fatherCard, 'Country of Residence').fill('Philippines');
    await fieldInput(fatherCard, 'Country of Birth').fill('Philippines');
    await fieldInput(fatherCard, 'Occupation').fill('Business Owner');

    // Expand Mother card
    await step10.locator('span:has-text("Mother")').click();
    await page.waitForTimeout(400);
    const motherCard = step10.locator('div.rounded-2xl:has(span:has-text("Mother"))');
    await fieldInput(motherCard, 'First Name').fill('Maria');
    await fieldInput(motherCard, 'Family Name').fill('Dela Cruz');
    await fieldInput(motherCard, 'Date of Birth').fill('1968-07-22');
    await fieldInput(motherCard, 'Partnership Status').selectOption('Married');
    await fieldInput(motherCard, 'Country of Residence').fill('Philippines');
    await fieldInput(motherCard, 'Country of Birth').fill('Philippines');
    await fieldInput(motherCard, 'Occupation').fill('Homemaker');

    await nextStep(page);

    // ── Step 11: Additional Info ──
    await expect(page.getByRole('heading', { name: /Additional Information/i })).toBeVisible();
    const step11 = page.locator('form');

    // NZ Contacts - Yes
    await toggleField(step11, 'Do you have any contacts in New Zealand', 'Yes');

    const nzCard = step11.locator('h3:has-text("NZ Contacts")').locator('..').locator('.bg-gray-50\\/50').first();
    await fieldInput(nzCard, 'First Name').fill('Carlos');
    await fieldInput(nzCard, 'Family Name').fill('Santos');
    await fieldInput(nzCard, 'Relationship').selectOption('Friend');
    await fieldInput(nzCard, 'Contact Number').fill('+6421234567');
    await fieldInput(nzCard, 'Address in New Zealand').fill('123 Queen Street, Auckland');

    // Military - No, No
    await toggleField(step11, 'Has military service been compulsory', 'No');
    await toggleField(step11, 'Have you ever undertaken military', 'No');

    // Property - Yes
    await toggleField(step11, 'Does your family own property', 'Yes');
    await fieldInput(step11, 'Property Type').selectOption('House');
    await fieldInput(step11, 'Location').fill('Makati City');
    await fieldInput(step11, 'Owner').selectOption('Parents');

    // Business - Yes
    await toggleField(step11, 'Does your family own a business', 'Yes');
    await fieldInput(step11, 'Type of Business').fill('Import/Export Trading');
    await fieldInput(step11, 'Your Involvement').fill('None');

    await nextStep(page);

    // ── Step 12: Declaration ──
    await expect(page.getByRole('heading', { name: /Declaration/i })).toBeVisible();

    // Dismiss any error modal that may have appeared
    const modal = page.locator('div.fixed.inset-0');
    if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
      const modalBtn = modal.getByRole('button');
      await modalBtn.click();
      await page.waitForTimeout(500);
    }

    await page.locator('input[type="checkbox"]').check({ force: true });
    await page.getByRole('button', { name: 'Submit Profile' }).click();

    // ── Verify Success ──
    await expect(page.getByRole('heading', { name: 'Success' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Protocol ID')).toBeVisible();
  });
});
