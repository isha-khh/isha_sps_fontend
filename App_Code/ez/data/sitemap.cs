///1.15.0226@SITEMAP模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;
using System.Web.UI.WebControls;
using System.IO;
using System.Xml;
using System.Text;

/// <summary>
/// sitemap 的摘要描述
/// </summary>

namespace ez.data
{
    public class sitemap : ez.function
    {
        ez.sql sql = new ez.sql();
        public string log;
        const string xmlPath = "~/App_Xml/sitemap.xml";

        public DataTable XmlTable = new DataTable();
        public List<PagesInfo> PagesInfos = new List<PagesInfo>();

        public sitemap()
        {
            //
            // TODO: 在這裡新增建構函式邏輯
            //
            XmlTable = LoadXmlTable();

        }

        #region 資料型別

        public struct PagesInfo
        {
            public string id;
            public string title;
            public string url;
            public List<PageInfo> PageInfo;
        }

        public struct PageInfo
        {
            public string id;
            public string title;
            public string src;
        }

        #endregion

        #region 讀取

        public DataTable LoadXmlTable()
        {


            DataTable dt = new DataTable();
            dt.Columns.Add("id");
            dt.Columns.Add("title");
            dt.Columns.Add("url");

            string XmlString = ReadFileContent(xmlPath);

            try
            {
                XmlDocument xmldoc = new XmlDocument();
                xmldoc.LoadXml(XmlString);
                XmlNodeList elemLists = xmldoc.GetElementsByTagName("website");

                foreach (XmlNode elemList in elemLists)
                {

                    if (elemList.HasChildNodes)
                    {

                        foreach (XmlNode elemList2 in elemList.ChildNodes)
                        {
                            if (elemList2.Name == "pages")
                            {
                                DataRow row = dt.NewRow();
                                row["id"] = elemList2.Attributes["id"].Value;
                                row["title"] = elemList2.Attributes["title"].Value;
                                row["url"] = elemList2.Attributes["url"].Value;
                                dt.Rows.Add(row);

                                PagesInfo PagesInfo = new PagesInfo();
                                PagesInfo.id = elemList2.Attributes["id"].Value;
                                PagesInfo.title = elemList2.Attributes["title"].Value;
                                PagesInfo.url = elemList2.Attributes["url"].Value;
                                PagesInfo.PageInfo = new List<PageInfo>();
                                if (elemList2.HasChildNodes)
                                {
                                    foreach (XmlNode elemList3 in elemList2.ChildNodes)
                                    {
                                        if (elemList3.Name == "page")
                                        {
                                            PageInfo PageInfo = new PageInfo();
                                            PageInfo.id = elemList3.Attributes["id"].Value;
                                            PageInfo.title = elemList3.Attributes["title"].Value;
                                            PageInfo.src = elemList3.Attributes["src"].Value;
                                            PagesInfo.PageInfo.Add(PageInfo);
                                        }
                                    }
                                }
                                PagesInfos.Add(PagesInfo);
                            }
                        }

                    }

                }

            }
            catch (Exception ex)
            {
                //throw;
            }

            return dt;
        }

        #endregion

        #region 新增

        public bool AddSiteMap(List<PagesInfo> AddPagesInfos)
        {
            bool success = true;
            log = "";

            int newCount = 0;
            foreach (PagesInfo AddPagesInfo in AddPagesInfos)
            {
                bool isOk = true;
                foreach (PagesInfo PagesInfo in PagesInfos)
                {
                    if (AddPagesInfo.id == PagesInfo.id)
                    {
                        isOk = false;
                        break;
                    }
                }
                if (isOk)
                {
                    PagesInfo NewPagesInfo = AddPagesInfo;
                    PagesInfos.Add(NewPagesInfo);
                    newCount++;
                }
            }

            if (newCount > 0)
            {
                StringBuilder sb = new StringBuilder();
                sb.AppendLine("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
                sb.AppendLine("<website>");

                foreach (PagesInfo PagesInfo in PagesInfos)
                {
                    sb.AppendLine("<pages id=\"" + PagesInfo.id + "\" title=\"" + PagesInfo.title + "\" url=\"" + PagesInfo.url + "\">");
                    if (PagesInfo.PageInfo.Count > 0)
                    {
                        foreach (PageInfo PageInfo in PagesInfo.PageInfo)
                        {
                            sb.AppendLine("<page id=\"" + PageInfo.id + "\" title=\"" + PageInfo.title + "\" src=\"" + PageInfo.src + "\"/>");
                        }
                    }
                    sb.AppendLine("</pages>");
                }

                sb.AppendLine("</website>");

                using (StreamWriter outfile = new StreamWriter(Server.MapPath(xmlPath), false))
                {
                    outfile.Write(sb.ToString());
                }

            }
                     

            return success;
        }

        #endregion




    }
}
