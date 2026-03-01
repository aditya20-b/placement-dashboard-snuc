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
"						
						
Percentage 	TOTAL	AIDS A	AIDS B	IOT A	IOT B	CS
Percentage  Placed	76.087	67.925	80.702	84.906	69.091	77.586
						
TOTAL (People)	210	36	46	45	38	45
						
TOTAL (Offers)	237	40	50	53	41	53
						
Company	Number Of Offers	AIDS A	AIDS B	IOT A	IOT B	CS 
ADF	2	1	0	0	1	0
Alight Solutions	1	0	0	1	0	0
Amazon (offcampus)	2	0	0	1	0	1"

- More data like "Total Count	Opt - Placement	Opt - Higher Studies	Placement Exempt		Company Offer Types
316	276	21	19		62
					
Opt - Placement	Placed	Not Placed	Hold	Dropped	Internship Only
276	210	66	0	0	13"

- More data like "	Gender Wise Placed  %	
Class	Male %	Female %
AIDS A	64.86	75
AIDS B	75.76	87.5
IOT A	82.35	89.47
IOT B	68.57	70
CS 	80	75
OVERALL	73.96	79.44"

- Also graphs like Class wise overview (seperation of Opted Higher Studies
Placement Exempt
Not Placed
Placed
Hold
Dropped)

- Class wise offers (barchart - count vs company, with color seperation of classwise) graph

- CTC distribution, offer types, Gender ratio classwsie placed graphs

## Sheet 06: CTC
- CTC finalical overview processed dashboard of offer_details sheet (with helper sheet)
- Here all data doesnot include offer type internship and displays the data.
- Overview "	Count	Highest CTC	Lowest CTC	Average CTC	Median CTC		
	237	1,00,00,000	3,50,000	10,75,393	8,25,000		
							
							
Top N (%)	Averages		Top 'N' 	Averages		Top N	Percentile Value
10	29,04,545		10	42,30,000		1	1,00,00,000
25	20,47,964		25	27,72,000		10	18,00,000
50	15,15,955		50	21,49,800		25	11,70,000
75	12,56,506		75	18,10,480		50	8,10,000
100	10,75,393		100	15,96,000		75	7,00,000
						100	3,50,000"

- Also more data "TOP OFFERS COUNT		
Company Offer	Count	
Prodapt	20	
NCR Voyix	13	
goML	12	
HSBC	10	
Citi Bank	9	
		
		
TOP OFFERS DETAILS		
Student	Offer	CTC
J Joshua Bharathi	MotorQ PPO	1,00,00,000
Priyadharshini S	Google PPO	59,00,000
H Saadvhi Sree	Google PPO	59,00,000
Jayashre K	Amazon (offcampus)	46,00,000
Arunan J 	Amazon (offcampus)	46,00,000
S Tejaswini	KLA PPO	27,00,000
Chindurah J	Qualcomm	24,00,000
Vishal Murugan	BNY PPO	22,00,000
Sansita Karthikeyan	BNY PPO	22,00,000
Aditya B	Citi Bank PPO	18,00,000"


- CTC vs date graph (comapny annoated)
- Count vs date graph (Comapany annotated) - Time line chart
- CTC distribution Graph 

## Sheet 07: Company_Details 
- Auto generated company wise overview dashboard using formula and helper sheet.
- Overview data
"S_No	Company Name	Offer Count	Offer Dates	CTCs / Stipends	%
1	Fidelity	3	30-Jul-2025	 ₹12,00,000 	1.2658
2	Quest1	3	04-Aug-2025	 ₹15,00,000 	1.2658
3	BNY	2	17-Aug-2025	 ₹22,00,000 	0.8439"

- Gender Ratio (company wise) graph
- Comapny ratio based on the % col
- Multiple  Offers sheet (formual generated), sample here "Multiple Offers			
Roll_No	Student	Companies	Comments
22110164	ASWIN CHANDRASEKAR	LTIMindtree, Mphasis	
22110124	BALIJAPALLI HAASYA SREE	Indium Software, Prodapt	
22110307	HARSHIT SHARMA	Indium Software, Verizon	
22110130	KAYALVIZHI S	Dzruptive AI, Verizon	
22110407	MIRRA G	LTIMindtree, Prodapt	"

# Note:
I make changes only here, other are formual and auto generated and updated on the sheet and graph
- Master Sheet: Update each student’s record with Placement Status and Company Details as comma-separated values to auto-update placement statistics.						
- Offer_Details Sheet: Enter every individual offer as a separate row with Roll Number, Name, Company, CTC (numeric), and Offer Range; include multiple offers by adding multiple rows.											