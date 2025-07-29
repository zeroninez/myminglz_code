import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  // API 키 검증 로직 제거
  if (!apiKey) {
    return NextResponse.json({ error: "API key is not configured" }, { status: 500 });
  }

  if (!databaseId) {
    return NextResponse.json({ error: "Database ID is not configured" }, { status: 500 });
  }

  try {
    const notion = new Client({
      auth: apiKey,
      // Notion API 버전 명시
      notionVersion: '2022-06-28'
    });

    console.log('Attempting to query database:', databaseId);
    
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "이름",
            title: {
              is_not_empty: true
            }
          }
        ]
      },
      sorts: [
        {
          property: "이름",
          direction: "ascending"
        }
      ]
    });

    console.log('Query response:', response);

    const storeBenefits = response.results.map((page: any) => ({
      id: page.id,
      name: page.properties["이름"].title[0]?.plain_text || "",
      description: page.properties["n원 할인, ~~ 무료 쿠폰"].rich_text[0]?.plain_text || "",
      condition: page.properties["n원 이상 주문 시"].number ? `${page.properties["n원 이상 주문 시"].number.toLocaleString()}원 이상 주문 시` : "",
      imageUrl: page.properties["썸네일"]?.files[0]?.file?.url || ""
    }));

    return NextResponse.json(storeBenefits);
  } catch (error: any) {
    console.error('API Error:', {
      code: error.code,
      message: error.message,
      name: error.name,
      status: error.status
    });

    return NextResponse.json({ 
      error: "Failed to fetch benefits",
      details: error.message,
      code: error.code
    }, { status: error.status || 500 });
  }
} 