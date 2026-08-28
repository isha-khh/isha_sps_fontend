using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Collections;
using System.Data;
using ez.data;
using Newtonsoft.Json;
using System.Web.UI.HtmlControls;

public partial class admin_template_pageset : ez.admin.PageBase
{
    public bool isOpenPrivate = false;
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {
            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
                if (!isStrNull(Request.QueryString["nation"])) { nation.SelectedValue = ValString(Request.QueryString["nation"]); }

                info WebSet = new info();
                WebSet.Load();
                isOpenPrivate = WebSet.Data.openPrivate;

                //設定seo
                uc_seo.CategoryValue = "default_" + nation.SelectedValue;
                uc_seo.NumValue = "0";
                uc_seo.seoTitle = "全域SEO";
                uc_seo.Load();

                //設定語系資料
                if (lan.Load(nation.SelectedValue))
                {
                    Com_name.Value = lan.Data.Com_name;
                    Com_tel.Value = lan.Data.Com_tel;
                    Com_fax.Value = lan.Data.Com_fax;
                    Com_mail.Value = lan.Data.Com_mail;
                    Com_address.Value = lan.Data.Com_address;
                    Com_gmap.Text = lan.Data.Com_gmap;
                    Com_bstime.Value = lan.Data.Com_bstime;
                  //  Com_facebook.Value = lan.Data.Com_facebook;
                    Com_more.Text = lan.Data.Com_more;
                    privatePanel.Visible = isOpenPrivate;
                    Com_private.Text = lan.Data.Com_private;

                    if (!isStrNull(lan.Data.Com_facebook))
                    {
                        //JSON字串
                        string CommunityJson = lan.Data.Com_facebook;
                        if (CommunityJson.IndexOf("Name") >-1)
                        {
                            //轉成物件
                            var list = JsonConvert.DeserializeObject<List<ez.language.IntroCommunity>>(CommunityJson);
                            foreach (var item in list)
                            {
                                if (lan.CommunityValue.Length > 0)
                                {
                                    foreach (string category in lan.CommunityValue)
                                    {
                                        HtmlInputText Com_facebook = (HtmlInputText)CommunityPanel.FindControl("Com_Community_" + item.Name);
                                        Com_facebook.Value = item.url;
                                    }
                                }
                            }

                        }
                        
                    }
                    //資料存取格式
                    //  [{"Name":"facebook","url":"https://zh-tw.facebook.com/eztrust","icon":"icon_f"},
                    // {"Name":"ig","url":"","icon":"icon_i"},{"Name":"youtobe","url":"","icon":"icon_y"}
                    // ,{"Name":"tweeter","url":"","icon":"icon_t"},{"Name":"pinterest","url":"","icon":"icon_p"}]

                }
                else
                {
                    msg.Text = lan.log;
                }

            }
            else
            {
                msg.Text = lan.log;
                Panel1.Enabled = false;
            }

         
        }
    }

    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect(Request.Url.AbsolutePath + "?nation=" + nation.SelectedValue);
    }


    protected void editButton_Click(object sender, EventArgs e)
    {
        if (IsValid)
        {
            ez.language lan = new ez.language();
            List<ez.language.IntroCommunity> IntroCommunityjsob = new List<ez.language.IntroCommunity>();

            if (lan.CommunityValue.Length > 0)
            {
                foreach (string category in lan.CommunityValue)
                {
                    HtmlInputText Com_facebook = (HtmlInputText)CommunityPanel.FindControl("Com_Community_" + category.Split('|')[0]);
                    if (!isStrNull(Com_facebook.Value.Trim()))
                    {
                        ez.language.IntroCommunity IntroCommunity = new ez.language.IntroCommunity
                        {
                            Name = category.Split('|')[0],
                            url = Com_facebook.Value,
                            icon = category.Split('|')[1]
                        };
                        IntroCommunityjsob.Add(IntroCommunity);
                    }
                }
            }
            string Com_Communityjson = JsonConvert.SerializeObject(IntroCommunityjsob);   //轉成JSON格式


            uc_seo.Save(); //設定seo        
            ez.language.DataInfo LanDataInfo = new ez.language.DataInfo();
            LanDataInfo.Code = nation.SelectedValue;
            LanDataInfo.Com_name = Com_name.Value;
            LanDataInfo.Com_tel = Com_tel.Value;
            LanDataInfo.Com_fax = Com_fax.Value;
            LanDataInfo.Com_mail = Com_mail.Value;
            LanDataInfo.Com_address = Com_address.Value;
            LanDataInfo.Com_gmap = Com_gmap.Text;
            LanDataInfo.Com_bstime = Com_bstime.Value;
           // LanDataInfo.Com_facebook = Com_facebook.Value;
            LanDataInfo.Com_more = Com_more.Text;
            LanDataInfo.Com_private = Com_private.Text;
            LanDataInfo.Com_facebook = Com_Communityjson;
           
            lan.Data = LanDataInfo;
            if (lan.SavePageInfo())
            {
                ScriptMsgAjax("儲存成功");
            }
            else
            {
                msg.Text = lan.log;
            }
        }     
    }
}