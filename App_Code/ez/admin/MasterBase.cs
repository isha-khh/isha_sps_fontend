///1.15.0216@後台MasterBase模組

using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net.Mail;
using System.Configuration;
using System.Drawing;
using System.Drawing.Imaging;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data.OleDb;
using Microsoft.VisualBasic;
using System.Text;
using System.Text.RegularExpressions;
using ez.admin;

/// <summary>
/// MasterBase 
/// </summary>

namespace ez.admin
{
    public class MasterBase : System.Web.UI.MasterPage
    {

        ez.function _f = new ez.function();
        ez.sql sql = new ez.sql();
        ez.admin.item item = new ez.admin.item();

        public user.loginInfoType loginInfo = new user.loginInfoType();

        public void systemMenu(Repeater rpt, int root, user.loginInfoType _loginInfo)
        {
            loginInfo = _loginInfo;
            string power = "";

            if (!_f.isStrNull(loginInfo.Power))
            {
                power = loginInfo.Power;  //權限表                     
            }


            if (loginInfo.isLoginDesginMode | !_f.isStrNull(power))
            {
                if (loginInfo.isLoginDesginMode) { power = ""; }
                DataTable dt = item.options(root, power);
                if (dt.Rows.Count > 0)
                {
                    rpt.DataSource = dt;
                    rpt.DataBind();
                }

            }

        }

        public void systemMenu_ItemDataBound(object sender, RepeaterItemEventArgs e)
        {
            DataRowView row = (DataRowView)e.Item.DataItem;
            HyperLink link = (HyperLink)e.Item.FindControl("link");
          
            link.Text = _f.ValString(row["title"]);
            if (_f.Val(row["root"]) == 0)
            {
                link.Text = "<span class=\"" + _f.ValString(row["icon"]) + "\"></span>" + link.Text;
                link.CssClass ="num" +_f.ValString(row["num"]);
                link.NavigateUrl = "javascript:void(0)";
                Repeater rpt = (Repeater)e.Item.FindControl("Repeater2");
                systemMenu(rpt, _f.Val(row["num"]), loginInfo);
            }
            else
            {
                link.NavigateUrl = _f.ValString(row["url"]);

                HyperLink manual = (HyperLink)e.Item.FindControl("manual");
                if (manual != null && !_f.isStrNull(row["part_no"]) && !_f.isStrNull(row["chapter"]))
                {
                    manual.NavigateUrl = "~/admin/manual/index.aspx?part_no=" + row["part_no"].ToString() + "&chapter=" + row["chapter"].ToString() + "&mroot=" + _f.ValString(row["root"]);
                    manual.Visible = true;
                }

            }
        }

        public string systemMenuNum()
        {
            if (!_f.isStrNull(HttpContext.Current.Request["mroot"]))
            {
                return _f.ValString(HttpContext.Current.Request["mroot"]);
            }
            else
            {
                string[] p = _f.ValString(HttpContext.Current.Request.Url.AbsolutePath).Split('/');
                string urlBase = "/" + p[p.Length - 2] + "/" + p[p.Length - 1];
                return item.pageRoot(urlBase);
            }       
        }
             
    }
}