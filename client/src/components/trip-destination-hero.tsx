import { useState, useEffect, useMemo } from "react";

/**
 * Normalize destination string for lookup (e.g. "New York, NY" → "new york", "San Francisco" → "san francisco").
 */
function normalizeDestination(destination: string): string {
  const firstPart = destination.split(",")[0]?.trim() ?? destination;
  return firstPart.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * US-only destinations: cities, states, and popular places. When a user selects a destination
 * for their trip, the trip view page shows a floating hero with imagery for that place.
 * Keys are normalized (lowercase). Partial matching supports "New York City" → new york, etc.
 */
const DESTINATION_IMAGES: Record<string, string[]> = {
  "new york": [
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2400&q=95", // NYC skyline
    "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=2400&q=95", // Times Square
    "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=2400&q=95", // Brooklyn Bridge
  ],
  "los angeles": [
    "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=2400&q=95", // LA skyline dusk
    "https://images.unsplash.com/photo-1580837119756-563d608dd119?w=2400&q=95", // Hollywood sign
    "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=2400&q=95", // Venice Beach
  ],
  chicago: [
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=2400&q=95", // Chicago skyline
    "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=2400&q=95", // Cloud Gate Bean
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=2400&q=95", // Chicago River
  ],
  houston: [
    "https://images.unsplash.com/photo-1544551763-46a01398b3f7?w=2400&q=95", // Houston skyline night
    "https://images.unsplash.com/photo-1562948148-f46f2dfe0b72?w=2400&q=95", // Houston downtown
  ],
  phoenix: [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // Desert sunset Phoenix
    "https://images.unsplash.com/photo-1591983282271-24e3be8e4f82?w=2400&q=95", // Phoenix cityscape
  ],
  philadelphia: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=2400&q=95", // Philadelphia skyline
    "https://images.unsplash.com/photo-1563998006502-e8533d3a7f0c?w=2400&q=95", // Liberty Bell area
  ],
  "san antonio": [
    "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=2400&q=95", // River Walk
    "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=2400&q=95", // Alamo
  ],
  "san diego": [
    "https://images.unsplash.com/photo-1580015919434-eee063b8e287?w=2400&q=95", // San Diego coastline
    "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=2400&q=95", // Balboa Park
  ],
  dallas: [
    "https://images.unsplash.com/photo-1552083375-1447ce886485?w=2400&q=95", // Dallas skyline
    "https://images.unsplash.com/photo-1585515320310-259814833e62?w=2400&q=95", // Dallas cityscape
  ],
  "san jose": [
    "https://images.unsplash.com/photo-1606252491402-1f5ab3caaa89?w=2400&q=95", // San Jose downtown
    "https://images.unsplash.com/photo-1602526214432-925e3aadd02e?w=2400&q=95", // Silicon Valley
  ],
  austin: [
    "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=2400&q=95", // Austin skyline
    "https://images.unsplash.com/photo-1531264095172-4940ca1a0b0e?w=2400&q=95", // Congress Avenue Bridge
    "https://images.unsplash.com/photo-1571983594856-221c56b3ee67?w=2400&q=95", // Austin downtown
  ],
  miami: [
    "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=2400&q=95", // Miami Beach aerial
    "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=2400&q=95", // South Beach
    "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=2400&q=95", // Miami skyline
  ],
  seattle: [
    "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=2400&q=95", // Space Needle
    "https://images.unsplash.com/photo-1609621838510-5ad474b7d25d?w=2400&q=95", // Seattle waterfront
  ],
  denver: [
    "https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=2400&q=95", // Denver with mountains
    "https://images.unsplash.com/photo-1546799969-59cc49d0876d?w=2400&q=95", // Denver skyline
  ],
  boston: [
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=2400&q=95", // Boston skyline
    "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=2400&q=95", // Boston harbor
  ],
  nashville: [
    "https://images.unsplash.com/photo-1550265706-c0db3c8f6b3f?w=2400&q=95", // Nashville skyline
    "https://images.unsplash.com/photo-1555400082-bb77dfaa4124?w=2400&q=95", // Broadway Nashville
  ],
  portland: [
    "https://images.unsplash.com/photo-1545162776-9ee96d2f2af9?w=2400&q=95", // Portland with Mt Hood
    "https://images.unsplash.com/photo-1569901750402-8ce0c8dcb072?w=2400&q=95", // Portland bridges
  ],
  "las vegas": [
    "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=2400&q=95", // Las Vegas Strip night
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=2400&q=95", // Vegas skyline
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=2400&q=95", // Fremont Street
  ],
  "washington dc": [
    "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=2400&q=95", // Washington Monument
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=2400&q=95", // US Capitol
  ],
  atlanta: [
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=2400&q=95", // Atlanta skyline
    "https://images.unsplash.com/photo-1565287726941-0ee3b7e1a56f?w=2400&q=95", // Atlanta downtown
  ],
  "new orleans": [
    "https://images.unsplash.com/photo-1518012312832-96aea3c91144?w=2400&q=95", // French Quarter
    "https://images.unsplash.com/photo-1590619093855-e4e0e46afb92?w=2400&q=95", // Bourbon Street
  ],
  "san francisco": [
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=2400&q=95", // Golden Gate Bridge
    "https://images.unsplash.com/photo-1521464302861-ce943915d1c3?w=2400&q=95", // SF painted ladies
    "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=2400&q=95", // SF bay aerial
  ],
  orlando: [
    "https://images.unsplash.com/photo-1548630826-2ec01a41f48f?w=2400&q=95", // Orlando theme parks
    "https://images.unsplash.com/photo-1584714268709-c3dd9c92b378?w=2400&q=95", // Orlando downtown
  ],
  tampa: [
    "https://images.unsplash.com/photo-1602262442687-8f1aad2c8b61?w=2400&q=95", // Tampa skyline
    "https://images.unsplash.com/photo-1582658883863-f5f0df2dd12a?w=2400&q=95", // Tampa waterfront
  ],
  minneapolis: [
    "https://images.unsplash.com/photo-1583766395091-fa0c07b9b1f4?w=2400&q=95", // Minneapolis skyline
    "https://images.unsplash.com/photo-1580832151620-e5310ab4b69e?w=2400&q=95", // Stone Arch Bridge
  ],
  cleveland: [
    "https://images.unsplash.com/photo-1605649433008-013ba4867e79?w=2400&q=95", // Cleveland skyline
    "https://images.unsplash.com/photo-1589640804402-e14b30079cc9?w=2400&q=95", // Cleveland lakefront
  ],
  "salt lake city": [
    "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c?w=2400&q=95", // Salt Lake with mountains
    "https://images.unsplash.com/photo-1580926480070-cf9d08ba3a3b?w=2400&q=95", // SLC downtown
  ],
  sacramento: [
    "https://images.unsplash.com/photo-1562408590-e32931084e23?w=2400&q=95", // Sacramento skyline
    "https://images.unsplash.com/photo-1609690845605-131b50e98ba0?w=2400&q=95", // Sacramento river
  ],
  "key west": [
    "https://images.unsplash.com/photo-1571060316723-42c53c43b9f6?w=2400&q=95", // Key West sunset
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Key West beach
  ],
  savannah: [
    "https://images.unsplash.com/photo-1556477234-96b68dd56db3?w=2400&q=95", // Savannah squares
    "https://images.unsplash.com/photo-1570723404883-f19f7a7d81b6?w=2400&q=95", // Forsyth Park
  ],
  charleston: [
    "https://images.unsplash.com/photo-1587468130448-9618e44e1b0f?w=2400&q=95", // Charleston historic
    "https://images.unsplash.com/photo-1627913256130-52c45a3f982e?w=2400&q=95", // Rainbow Row
  ],
  aspen: [
    "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=2400&q=95", // Aspen ski slopes
    "https://images.unsplash.com/photo-1544986581-efac024faf62?w=2400&q=95", // Aspen fall colors
  ],
  "lake tahoe": [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", // Lake Tahoe crystal clear
    "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=2400&q=95", // Emerald Bay
  ],
  "grand canyon": [
    "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=2400&q=95", // Grand Canyon sunrise
    "https://images.unsplash.com/photo-1623001491539-7c0a4a108c27?w=2400&q=95", // Grand Canyon vista
  ],
  yosemite: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // El Capitan
    "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=2400&q=95", // Half Dome
  ],
  yellowstone: [
    "https://images.unsplash.com/photo-1580068113230-c56942178c6f?w=2400&q=95", // Grand Prismatic Spring
    "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=2400&q=95", // Old Faithful
  ],
  zion: [
    "https://images.unsplash.com/photo-1608012391066-e40f54a1ba43?w=2400&q=95", // Zion canyon
    "https://images.unsplash.com/photo-1591326538842-80c1b8d03e9b?w=2400&q=95", // The Narrows
  ],
  california: [
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=2400&q=95", // Golden Gate Bridge
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=95", // California coast
    "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=2400&q=95", // Yosemite
  ],
  florida: [
    "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=2400&q=95", // Miami Beach aerial
    "https://images.unsplash.com/photo-1571060316723-42c53c43b9f6?w=2400&q=95", // Key West
    "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=2400&q=95", // Florida beaches
  ],
  colorado: [
    "https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=2400&q=95", // Rocky Mountains
    "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=2400&q=95", // Aspen
  ],
  hawaii: [
    "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=2400&q=95", // Hawaii paradise
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Waikiki Beach
    "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=2400&q=95", // Hawaii landscape
  ],
  texas: [
    "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=2400&q=95", // Austin Capitol
    "https://images.unsplash.com/photo-1552083375-1447ce886485?w=2400&q=95", // Dallas skyline
  ],
  arizona: [
    "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=2400&q=95", // Grand Canyon
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // Arizona desert
  ],
  utah: [
    "https://images.unsplash.com/photo-1608012391066-e40f54a1ba43?w=2400&q=95", // Zion National Park
    "https://images.unsplash.com/photo-1591326538842-80c1b8d03e9b?w=2400&q=95", // Arches
  ],
  nevada: [
    "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=2400&q=95", // Las Vegas Strip
    "https://images.unsplash.com/photo-1542759564-7ccbb6ac450a?w=2400&q=95", // Red Rock Canyon
  ],
  oregon: [
    "https://images.unsplash.com/photo-1545162776-9ee96d2f2af9?w=2400&q=95", // Portland Mt Hood
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Oregon Coast
  ],
  washington: [
    "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=2400&q=95", // Seattle Space Needle
    "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=2400&q=95", // Mt Rainier
  ],
  "new mexico": [
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=2400&q=95", // Santa Fe adobe
    "https://images.unsplash.com/photo-1565204077026-c03f022442b4?w=2400&q=95", // Albuquerque balloons
  ],
  montana: [
    "https://images.unsplash.com/photo-1541890289-6e0423c66a62?w=2400&q=95", // Glacier National Park
    "https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=2400&q=95", // Montana mountains
  ],
  alaska: [
    "https://images.unsplash.com/photo-1554844453-7ea2a562a6c8?w=2400&q=95", // Alaska wilderness
    "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=2400&q=95", // Alaska glaciers
  ],
  // ——— All 50 states and top travel cities ———
  alabama: [
    "https://images.unsplash.com/photo-1580492331950-e07134adfeb7?w=2400&q=95", // Alabama Gulf Coast
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Alabama beaches
  ],
  birmingham: [
    "https://images.unsplash.com/photo-1600002415506-dd06090d3480?w=2400&q=95", // Birmingham skyline
    "https://images.unsplash.com/photo-1569437061241-a848be43cc82?w=2400&q=95", // Vulcan statue Birmingham
  ],
  "gulf shores": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Gulf Shores white sand
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Gulf Coast sunset
  ],
  arkansas: [
    "https://images.unsplash.com/photo-1566024287937-6964471fcf02?w=2400&q=95", // Arkansas Ozarks
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // Natural State beauty
  ],
  "little rock": [
    "https://images.unsplash.com/photo-1563518926768-f0a218651f78?w=2400&q=95", // Little Rock downtown
    "https://images.unsplash.com/photo-1558791020-89f0395e3b88?w=2400&q=95", // Arkansas River bridge
  ],
  "hot springs": [
    "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=2400&q=95", // Hot Springs National Park
    "https://images.unsplash.com/photo-1580068113230-c56942178c6f?w=2400&q=95", // Hot Springs bathhouses
  ],
  connecticut: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=2400&q=95", // Connecticut fall foliage
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Connecticut countryside
  ],
  hartford: [
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Hartford Capitol building
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Hartford skyline
  ],
  "new haven": [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=2400&q=95", // Yale University
    "https://images.unsplash.com/photo-1571687949921-1306bfb24b72?w=2400&q=95", // New Haven green
  ],
  mystic: [
    "https://images.unsplash.com/photo-1564759298141-cef86f51d4d4?w=2400&q=95", // Mystic Seaport
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Mystic harbor
  ],
  delaware: [
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Delaware beaches
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Delaware coast
  ],
  wilmington: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Wilmington skyline
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Wilmington waterfront
  ],
  "rehoboth beach": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Rehoboth Beach boardwalk
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Delaware shore
  ],
  georgia: [
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=2400&q=95", // Atlanta skyline
    "https://images.unsplash.com/photo-1556477234-96b68dd56db3?w=2400&q=95", // Savannah squares
  ],
  idaho: [
    "https://images.unsplash.com/photo-1544986581-efac024faf62?w=2400&q=95", // Idaho mountains
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Sawtooth Range
  ],
  boise: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Boise skyline
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2400&q=95", // Boise foothills
  ],
  "sun valley": [
    "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=2400&q=95", // Sun Valley skiing
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=2400&q=95", // Sun Valley resort
  ],
  illinois: [
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=2400&q=95", // Chicago skyline
    "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=2400&q=95", // Illinois landscapes
  ],
  indiana: [
    "https://images.unsplash.com/photo-1583766389331-0878e336e33b?w=2400&q=95", // Indianapolis cityscape
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=2400&q=95", // Indiana farmland
  ],
  indianapolis: [
    "https://images.unsplash.com/photo-1583766389331-0878e336e33b?w=2400&q=95", // Indianapolis skyline
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Monument Circle
  ],
  bloomington: [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=2400&q=95", // IU campus
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=2400&q=95", // Bloomington fall
  ],
  iowa: [
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=2400&q=95", // Iowa cornfields
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // Iowa countryside
  ],
  "des moines": [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Des Moines skyline
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Iowa State Capitol
  ],
  kansas: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // Kansas wheat fields
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=95", // Kansas plains sunset
  ],
  wichita: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Wichita skyline
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // Kansas prairie
  ],
  "kansas city": [
    "https://images.unsplash.com/photo-1590959651373-a3db0f38a961?w=2400&q=95", // Kansas City skyline
    "https://images.unsplash.com/photo-1572466791327-c1a7697776ee?w=2400&q=95", // KC Plaza fountains
  ],
  kentucky: [
    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=2400&q=95", // Kentucky bluegrass
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=2400&q=95", // Horse country
  ],
  louisville: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Louisville skyline
    "https://images.unsplash.com/photo-1579302607445-00bfc7c3e3ec?w=2400&q=95", // Churchill Downs racetrack
  ],
  lexington: [
    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=2400&q=95", // Lexington horse farms
    "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=2400&q=95", // Kentucky thoroughbreds
  ],
  louisiana: [
    "https://images.unsplash.com/photo-1518012312832-96aea3c91144?w=2400&q=95", // Louisiana swamps
    "https://images.unsplash.com/photo-1590619093855-e4e0e46afb92?w=2400&q=95", // New Orleans
  ],
  maine: [
    "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=2400&q=95", // Maine rocky coast
    "https://images.unsplash.com/photo-1580654892302-efc48fa5cdc1?w=2400&q=95", // Maine lighthouse
  ],
  "portland maine": [
    "https://images.unsplash.com/photo-1580654892302-efc48fa5cdc1?w=2400&q=95", // Portland Head Light
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Portland harbor
  ],
  "bar harbor": [
    "https://images.unsplash.com/photo-1580479444521-c16c641c1d1b?w=2400&q=95", // Bar Harbor coastal view
    "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=2400&q=95", // Acadia coastline
  ],
  acadia: [
    "https://images.unsplash.com/photo-1580479444521-c16c641c1d1b?w=2400&q=95", // Acadia National Park
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Acadia mountains
  ],
  maryland: [
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Chesapeake Bay
    "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=2400&q=95", // Maryland monument
  ],
  baltimore: [
    "https://images.unsplash.com/photo-1585155967594-f53e21aa7b49?w=2400&q=95", // Baltimore Inner Harbor
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Baltimore skyline
  ],
  annapolis: [
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Annapolis sailboats
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Naval Academy dome
  ],
  "ocean city": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Ocean City MD beach
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // Ocean City boardwalk
  ],
  massachusetts: [
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=2400&q=95", // Boston skyline
    "https://images.unsplash.com/photo-1580654892302-efc48fa5cdc1?w=2400&q=95", // Cape Cod lighthouse
  ],
  cambridge: [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=2400&q=95", // Harvard Yard
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=2400&q=95", // MIT campus
  ],
  "cape cod": [
    "https://images.unsplash.com/photo-1580654892302-efc48fa5cdc1?w=2400&q=95", // Cape Cod lighthouse
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Cape Cod beaches
  ],
  michigan: [
    "https://images.unsplash.com/photo-1567295719934-ca73e62092db?w=2400&q=95", // Great Lakes Michigan
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", // Michigan lakes
  ],
  detroit: [
    "https://images.unsplash.com/photo-1596661443552-5a4c49fc4b1c?w=2400&q=95", // Detroit skyline
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Detroit downtown
  ],
  "ann arbor": [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=2400&q=95", // University of Michigan
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=2400&q=95", // Ann Arbor campus
  ],
  "traverse city": [
    "https://images.unsplash.com/photo-1567295719934-ca73e62092db?w=2400&q=95", // Lake Michigan shore
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", // Sleeping Bear Dunes
  ],
  "grand rapids": [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Grand Rapids skyline
    "https://images.unsplash.com/photo-1567295719934-ca73e62092db?w=2400&q=95", // Grand River
  ],
  mississippi: [
    "https://images.unsplash.com/photo-1580492331950-e07134adfeb7?w=2400&q=95", // Mississippi Gulf Coast
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=2400&q=95", // Mississippi Delta
  ],
  jackson: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Jackson MS skyline
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Mississippi Capitol
  ],
  missouri: [
    "https://images.unsplash.com/photo-1590959651373-a3db0f38a961?w=2400&q=95", // Gateway Arch
    "https://images.unsplash.com/photo-1572466791327-c1a7697776ee?w=2400&q=95", // Kansas City
  ],
  "st. louis": [
    "https://images.unsplash.com/photo-1590959651373-a3db0f38a961?w=2400&q=95", // Gateway Arch
    "https://images.unsplash.com/photo-1560785477-d43d36dce3f1?w=2400&q=95", // St. Louis skyline
  ],
  branson: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Ozark Mountains
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=2400&q=95", // Table Rock Lake
  ],
  nebraska: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // Nebraska plains
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=95", // Nebraska sunset
  ],
  omaha: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Omaha skyline
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Omaha riverfront
  ],
  lincoln: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Lincoln NE skyline
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Nebraska State Capitol
  ],
  "new hampshire": [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // White Mountains NH
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=2400&q=95", // New Hampshire fall
  ],
  manchester: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Manchester NH skyline
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Merrimack River
  ],
  portsmouth: [
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Portsmouth Harbor
    "https://images.unsplash.com/photo-1580654892302-efc48fa5cdc1?w=2400&q=95", // Portsmouth lighthouse
  ],
  "new jersey": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Jersey Shore
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2400&q=95", // NJ NYC skyline view
  ],
  "atlantic city": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Atlantic City boardwalk
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=2400&q=95", // AC casinos
  ],
  "cape may": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Cape May beach
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Cape May Victorian
  ],
  "new york state": [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Adirondacks
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2400&q=95", // NYC
  ],
  "north carolina": [
    "https://images.unsplash.com/photo-1544986581-efac024faf62?w=2400&q=95", // Blue Ridge Mountains NC
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Outer Banks
  ],
  charlotte: [
    "https://images.unsplash.com/photo-1590933359950-53a4ace67960?w=2400&q=95", // Charlotte skyline
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Charlotte uptown
  ],
  raleigh: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Raleigh skyline
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // NC State Capitol
  ],
  asheville: [
    "https://images.unsplash.com/photo-1544986581-efac024faf62?w=2400&q=95", // Asheville Blue Ridge
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Biltmore area
  ],
  "north dakota": [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // North Dakota plains
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=95", // ND sunset prairie
  ],
  fargo: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Fargo ND skyline
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // Red River Valley
  ],
  ohio: [
    "https://images.unsplash.com/photo-1605649433008-013ba4867e79?w=2400&q=95", // Ohio cities
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Ohio skylines
  ],
  columbus: [
    "https://images.unsplash.com/photo-1596661443552-5a4c49fc4b1c?w=2400&q=95", // Columbus OH skyline
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Columbus downtown
  ],
  cincinnati: [
    "https://images.unsplash.com/photo-1605649433008-013ba4867e79?w=2400&q=95", // Cincinnati skyline
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Cincinnati riverfront
  ],
  oklahoma: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // Oklahoma plains
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=95", // Oklahoma prairie
  ],
  "oklahoma city": [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Oklahoma City skyline
    "https://images.unsplash.com/photo-1516549655169-d59e2f081448?w=2400&q=95", // OKC downtown
  ],
  tulsa: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Tulsa skyline
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Tulsa Arkansas River
  ],
  pennsylvania: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=2400&q=95", // Philadelphia
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // PA mountains
  ],
  pittsburgh: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Pittsburgh skyline
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Three rivers Pittsburgh
  ],
  "rhode island": [
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Rhode Island coast
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // RI beaches
  ],
  providence: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Providence skyline
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // RI State House
  ],
  newport: [
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Newport mansions area
    "https://images.unsplash.com/photo-1580654892302-efc48fa5cdc1?w=2400&q=95", // Newport lighthouse
  ],
  "south carolina": [
    "https://images.unsplash.com/photo-1587468130448-9618e44e1b0f?w=2400&q=95", // Charleston SC
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // SC beaches
  ],
  "myrtle beach": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Myrtle Beach
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // SC coast
  ],
  "south dakota": [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // South Dakota badlands
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Black Hills
  ],
  "rapid city": [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Rapid City Black Hills
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // SD landscape
  ],
  badlands: [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // Badlands formations
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=95", // Badlands sunset
  ],
  tennessee: [
    "https://images.unsplash.com/photo-1550265706-c0db3c8f6b3f?w=2400&q=95", // Nashville skyline
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Smoky Mountains
  ],
  memphis: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Memphis skyline
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Memphis Mississippi River
  ],
  knoxville: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Knoxville Smokies
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Knoxville skyline
  ],
  vermont: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=2400&q=95", // Vermont fall foliage
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Green Mountains
  ],
  burlington: [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", // Lake Champlain
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Burlington VT
  ],
  stowe: [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=2400&q=95", // Stowe ski resort
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Stowe mountains
  ],
  virginia: [
    "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=2400&q=95", // Virginia monuments
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Virginia coast
  ],
  "virginia beach": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=2400&q=95", // Virginia Beach
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95", // VA Beach oceanfront
  ],
  richmond: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Richmond skyline
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Virginia Capitol
  ],
  williamsburg: [
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Colonial Williamsburg
    "https://images.unsplash.com/photo-1580015919434-eee063b8e287?w=2400&q=95", // Historic Virginia
  ],
  "west virginia": [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // West Virginia mountains
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2400&q=95", // WV wilderness
  ],
  "harpers ferry": [
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=2400&q=95", // Harpers Ferry rivers
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // WV Blue Ridge
  ],
  wisconsin: [
    "https://images.unsplash.com/photo-1567295719934-ca73e62092db?w=2400&q=95", // Wisconsin Great Lakes
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", // Wisconsin lakes
  ],
  milwaukee: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Milwaukee skyline
    "https://images.unsplash.com/photo-1567295719934-ca73e62092db?w=2400&q=95", // Milwaukee lakefront
  ],
  madison: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95", // Madison Wisconsin Capitol
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", // Madison lakes
  ],
  "door county": [
    "https://images.unsplash.com/photo-1567295719934-ca73e62092db?w=2400&q=95", // Door County water
    "https://images.unsplash.com/photo-1580654892302-efc48fa5cdc1?w=2400&q=95", // Door County lighthouse
  ],
  wyoming: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Wyoming Grand Tetons
    "https://images.unsplash.com/photo-1580068113230-c56942178c6f?w=2400&q=95", // Yellowstone Wyoming
  ],
  "jackson hole": [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Jackson Hole Tetons
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=2400&q=95", // Jackson Hole ski
  ],
  cheyenne: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=2400&q=95", // Cheyenne prairie
    "https://images.unsplash.com/photo-1598524627893-bdf1a9298dc8?w=2400&q=95", // Wyoming State Capitol
  ],
  "santa fe": [
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=2400&q=95", // Santa Fe adobe
    "https://images.unsplash.com/photo-1565204077026-c03f022442b4?w=2400&q=95", // New Mexico desert
  ],
  albuquerque: [
    "https://images.unsplash.com/photo-1565204077026-c03f022442b4?w=2400&q=95", // Albuquerque balloons
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // ABQ desert
  ],
  reno: [
    "https://images.unsplash.com/photo-1542759564-7ccbb6ac450a?w=2400&q=95", // Reno Nevada
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Sierra Nevada Reno
  ],
  "fort lauderdale": [
    "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=2400&q=95", // Fort Lauderdale beach
    "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=2400&q=95", // Fort Lauderdale coast
  ],
  "palm springs": [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // Palm Springs desert
    "https://images.unsplash.com/photo-1591983282271-24e3be8e4f82?w=2400&q=95", // Palm Springs palms
  ],
  scottsdale: [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2400&q=95", // Scottsdale desert
    "https://images.unsplash.com/photo-1591983282271-24e3be8e4f82?w=2400&q=95", // Scottsdale Arizona
  ],
};

/** Fallback for US destinations not in the map (generic US travel / road trip). */
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=95", // Scenic landscape
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", // Lake Tahoe
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", // Yosemite
];

const ROTATE_INTERVAL_MS = 5500;

/** Returns the first cover image URL for a destination (e.g. for dashboard trip cards). Uses same lookup as the hero. */
export function getDestinationCoverImage(destination: string): string {
  const key = normalizeDestination(destination ?? "");
  if (!key) return DEFAULT_IMAGES[0];
  const exact = DESTINATION_IMAGES[key];
  if (exact?.length) return exact[0];
  const partial = Object.entries(DESTINATION_IMAGES).find(
    ([k]) => key.length >= 2 && (key.includes(k) || k.includes(key))
  );
  return partial?.[1]?.[0] ?? DEFAULT_IMAGES[0];
}


export interface TripDestinationHeroProps {
  destination: string;
}

/**
 * Trip destination hero for the trip view page. When the user selects a destination
 * for their trip, this shows a rotating hero with imagery for that destination.
 *
 * - Uses hardcoded Unsplash images for US destinations (instant loading)
 * - Covers all major US cities, states, and popular destinations
 * - Falls back to generic travel images for unrecognized destinations
 */
export function TripDestinationHero({ destination }: TripDestinationHeroProps) {
  const images = useMemo(() => {
    const key = normalizeDestination(destination ?? "");
    if (!key) return DEFAULT_IMAGES;

    // Try exact match
    const exact = DESTINATION_IMAGES[key];
    if (exact?.length) return exact;

    // Try partial match
    const partial = Object.entries(DESTINATION_IMAGES).find(
      ([k]) => key.length >= 2 && (key.includes(k) || k.includes(key))
    );
    return partial?.[1] ?? DEFAULT_IMAGES;
  }, [destination]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <section
      className="relative w-full aspect-[21/9] min-h-[220px] max-h-[420px] overflow-hidden shrink-0"
      aria-label={`Imagery for ${destination}`}
    >
      <div className="absolute inset-0">
        {images.map((url, i) => (
          <div
            key={url}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              zIndex: i === index ? 1 : 0,
            }}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover object-center hero-float"
              fetchPriority={i === 0 ? "high" : "low"}
            />
          </div>
        ))}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 pointer-events-none"
          aria-hidden
        />
      </div>
    </section>
  );
}
