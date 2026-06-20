"""ASX 100 constituent lists as at 30 June each year.

These are the TSR peer groups — AGL is ranked against these companies
for each period. The list is fixed at the start date (no survivorship bias).
"""

# As at 30 June 2023 — from AGL's TSR comparator group documentation
ASX100_JUN_2023 = [
    'A2M.AX',   # The A2 Milk Company Limited
    'AGL.AX',   # AGL Energy Limited
    'AKE.AX',   # Allkem Limited
    'ALD.AX',   # Ampol Limited
    'ALL.AX',   # Aristocrat Leisure Limited
    'ALQ.AX',   # ALS Limited
    'ALU.AX',   # Altium Limited
    'ALX.AX',   # Atlas Arteria
    'AMC.AX',   # Amcor PLC
    'AMP.AX',   # AMP Limited
    'ANN.AX',   # Ansell Limited
    'ANZ.AX',   # ANZ Group Holdings Limited
    'APA.AX',   # APA Group
    'ASX.AX',   # ASX Limited
    'AWC.AX',   # Alumina Limited
    'AZJ.AX',   # Aurizon Holdings Limited
    'BEN.AX',   # Bendigo and Adelaide Bank Limited
    'BHP.AX',   # BHP Group Limited
    'BOQ.AX',   # Bank of Queensland Limited
    'BSL.AX',   # BlueScope Steel Limited
    'BXB.AX',   # Brambles Limited
    'CAR.AX',   # Carsales.Com Limited
    'CBA.AX',   # Commonwealth Bank of Australia
    'CGF.AX',   # Challenger Limited
    'CHC.AX',   # Charter Hall Group
    'COH.AX',   # Cochlear Limited
    'COL.AX',   # Coles Group Limited
    'CPU.AX',   # Computershare Limited
    'CSL.AX',   # CSL Limited
    'CWY.AX',   # Cleanaway Waste Management Limited
    'DMP.AX',   # Domino's Pizza Enterprises Limited
    'DOW.AX',   # Downer EDI Limited
    'DXS.AX',   # Dexus
    'EDV.AX',   # Endeavour Group Limited
    'EVN.AX',   # Evolution Mining Limited
    'FMG.AX',   # Fortescue Metals Group Ltd
    'FPH.AX',   # Fisher & Paykel Healthcare Corporation Limited
    'GMG.AX',   # Goodman Group
    'GPT.AX',   # GPT Group
    'HVN.AX',   # Harvey Norman Holdings Limited
    'IAG.AX',   # Insurance Australia Group Limited
    'IEL.AX',   # IDP Education Limited
    'IGO.AX',   # IGO Limited
    'ILU.AX',   # Iluka Resources Limited
    'IPL.AX',   # Incitec Pivot Limited
    'JBH.AX',   # JB Hi-Fi Limited
    'JHX.AX',   # James Hardie Industries PLC
    'LLC.AX',   # Lendlease Group
    'LYC.AX',   # Lynas Rare Earths Limited
    'MGR.AX',   # Mirvac Group
    'MIN.AX',   # Mineral Resources Limited
    'MPL.AX',   # Medibank Private Limited
    'MQG.AX',   # Macquarie Group Limited
    'MTS.AX',   # Metcash Limited
    'NAB.AX',   # National Australia Bank Limited
    'NCM.AX',   # Newcrest Mining Limited
    'NEC.AX',   # Nine Entertainment Co. Holdings Limited
    'NHF.AX',   # NIB Holdings Limited
    'NST.AX',   # Northern Star Resources Ltd
    'NXT.AX',   # Nextdc Limited
    'ORA.AX',   # Orora Limited
    'ORG.AX',   # Origin Energy Limited
    'ORI.AX',   # Orica Limited
    'PLS.AX',   # Pilbara Minerals Limited
    'QAN.AX',   # Qantas Airways Limited
    'QBE.AX',   # QBE Insurance Group Limited
    'QUB.AX',   # Qube Holdings Limited
    'REA.AX',   # REA Group Limited
    'REH.AX',   # Reece Limited
    'RGN.AX',   # Region Group
    'RHC.AX',   # Ramsay Health Care Limited
    'RIO.AX',   # Rio Tinto Limited
    'RMD.AX',   # ResMed Inc.
    'RWC.AX',   # Reliance Worldwide Corporation Limited
    'S32.AX',   # South32 Limited
    'SCG.AX',   # Scentre Group
    'SDF.AX',   # Steadfast Group Limited
    'SEK.AX',   # Seek Limited
    'SGP.AX',   # Stockland
    'SHL.AX',   # Sonic Healthcare Limited
    'SOL.AX',   # Washington H Soul Pattinson & Company Limited
    'SQ2.AX',   # Block Inc
    'STO.AX',   # Santos Limited
    'SUN.AX',   # Suncorp Group Limited
    'SVW.AX',   # Seven Group Holdings Limited
    'TCL.AX',   # Transurban Group
    'TLC.AX',   # The Lottery Corporation Limited
    'TLS.AX',   # Telstra Group Limited
    'TNE.AX',   # Technology One Limited
    'TWE.AX',   # Treasury Wine Estates Limited
    'VCX.AX',   # Vicinity Centres
    'VUK.AX',   # Virgin Money UK PLC
    'WBC.AX',   # Westpac Banking Corporation
    'WDS.AX',   # Woodside Energy Group Ltd
    'WES.AX',   # Westfarmers Limited
    'WHC.AX',   # Whitehaven Coal Limited
    'WOR.AX',   # Worley Limited
    'WOW.AX',   # Woolworths Group Limited
    'WTC.AX',   # WiseTech Global Limited
    'XRO.AX',   # Xero Limited
]

# Map period start dates to constituent lists
PEER_GROUPS = {
    '2023-07-01': ASX100_JUN_2023,
    # TODO: Add 2024, 2025, 2026 constituent lists when available
}
