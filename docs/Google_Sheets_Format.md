# Placement Tracker

**Overview**
- Total Sheets : 7 sheets

## Sheet 01: Master 
- Source of information of all student details (AIDS / IOT / CyberSecurity)
- Structure [per row]
    - Roll No: 8 digit number
    - Reg No: 11 digit number
    - Name: Name of student (all in caps)
    - Gender: Male / Female
    - Class: AIDS / IOT / CS	
    - Section: A / B ; CS doesnot have any section (empty)	
    - Choice: Higher Studies / Placement / Placement Exempt
    - Status: Placed / Hold / Not Placed / Dropped / LOR Issued
    - Company: Comma seperated values of companies (multiple offers)
- 316 record of these data

## Sheet 02: Offer Details
- Source of information offer got by students
- Structure [per row]
    - Roll Number: 8 digit number (key from Master)
    - Name: Name of student (Title Case)
    - Company (Offer Detail): Company Offered (single value)
    - CTC / Stipend: Amount (IN INR)
    - Offer Type: Regular / Dream / Super Dream / Marquee / Internship	
    - Offer Date: Date of offer (some rows are blank)

## Sheet 03 (Helper Sheet): func
- COnverts the master sheet data into "Roll_No	Name	Class	Offered_Company", where each csv value (multiple value) is individual row/record - processing
- Only take data when Compant col (in Master) is not null
- used in Offers sheet for the count table

## Sheet 04 (Helper Sheet): stats
- Helper sheet for mathematical operations, that take count and process each cell is filled with formula.
- Table 1: overall stats (Class	Total Students	Male	Female	Opted Placement	Opted Higher Studies	Placement Exempt	Placed	Not Placed	Hold	Dropped	Placement %	Male %	Female %
AIDS A	62	43	19	53	4	5	36	17	0	0	67.92	64.86	75
AIDS B	63	37	26	57	4	2	46	11	0	0	80.7	75.76	87.5
IOT A	63	40	23	53	6	4	45	8	0	0	84.91	82.35	89.47
IOT B	64	44	20	55	3	6	38	17	0	0	69.09	68.57	70
CS 	64	34	30	58	4	2	45	13	0	0	77.59	80	75)

- Offer Count : (CTC,Count)
- Supporting Data (For Graph) :	(Cumulative Count, Percentile, Average Line	, Median Line)
- Company Visit Summary	(Offer Date,Company,CTC,Count)

- THese sheet data are directly used for creating dashboard like enriched table and graphs for more visuals

## Sheet 05: Offers
- contain a dashboard view, snippet
- Also graphs like Class wise overview (seperation of Opted Higher Studies, Placement Exempt, Not Placed, Placed, Hold, Dropped)
- Class wise offers (barchart - count vs company, with color seperation of classwise) graph
- CTC distribution, offer types, Gender ratio classwsie placed graphs

## Sheet 06: CTC
- CTC finalical overview processed dashboard of offer_details sheet (with helper sheet)
- Here all data doesnot include offer type internship and displays the data.
- CTC vs date graph (comapny annoated)
- Count vs date graph (Comapany annotated) - Time line chart
- CTC distribution Graph 

## Sheet 07: Company_Details 
- Auto generated company wise overview dashboard using formula and helper sheet.
- Gender Ratio (company wise) graph
- Comapny ratio based on the % col
- Multiple  Offers sheet (formual generated)


# Note:
I make changes only here, other are formual and auto generated and updated on the sheet and graph
- Master Sheet: Update each student’s record with Placement Status and Company Details as comma-separated values to auto-update placement statistics.						
- Offer_Details Sheet: Enter every individual offer as a separate row with Roll Number, Name, Company, CTC (numeric), and Offer Range; include multiple offers by adding multiple rows.											